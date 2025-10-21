"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Play, Upload, Eye, EyeOff, GripVertical, X, FileVideo, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { videoAnalyticsApi } from '@/lib/api';
import { MediaLibrary } from '@/components/cms/MediaLibrary';

interface Video {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  publishDate: string;
  order: number;
  isActive: boolean;
  analytics?: {
    views: number;
    clicks: number;
    playTime: number;
    completionRate: number;
    lastViewed?: string;
  };
}

interface HomepageContent {
  _id: string;
  sectionType: string;
  title: string;
  description: string;
  isActive: boolean;
  content: {
    videos: Video[];
  };
  displaySettings: {
    showTitle: boolean;
    showDescription: boolean;
    itemsPerRow: number;
    maxItems: number;
    showViewMore: boolean;
    viewMoreText: string;
    viewMoreLink: string;
  };
}

// Sortable Video Item Component
const SortableVideoItem = ({ video, onEdit, onDelete, onToggleActive, rank }: {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (videoId: string) => void;
  onToggleActive: (videoId: string) => void;
  rank?: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "opacity-50")}>
      <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200 group">
        <CardHeader className="pb-4 pt-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6 flex-1">
              <div className="absolute top-5 left-4 cursor-grab text-gray-400 hover:text-gray-600" {...listeners}>
                <GripVertical className="w-5 h-5" />
              </div>
              
              {/* Video Thumbnail */}
              <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100 ml-8 flex-shrink-0 mt-1">
                {/* Popularity Rank - positioned inside thumbnail */}
                {rank && (
                  <div className={`absolute top-1 right-1 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-20 border-2 border-white bg-black/20 backdrop-blur-sm ${
                    rank === 1 ? 'bg-yellow-500' : 
                    rank === 2 ? 'bg-gray-400' : 
                    rank === 3 ? 'bg-orange-500' : 
                    'bg-blue-600'
                  }`}>
                    #{rank}
                  </div>
                )}
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0 pl-4">
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {video.title}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {video.description || 'No description provided'}
                </p>
                
                {/* Analytics Data */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{video.analytics?.views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{video.analytics?.clicks || 0} clicks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{video.analytics?.completionRate?.toFixed(1) || 0}% completion</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {video.duration && video.duration !== 'Unknown duration' ? video.duration : 'Unknown duration'}
                  </Badge>
                  <Badge 
                    variant={video.isActive ? 'default' : 'secondary'}
                    className={cn(
                      "text-xs",
                      video.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {video.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Order: {video.order}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(video.publishDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleActive(video._id)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title={video.isActive ? 'Deactivate video' : 'Activate video'}
              >
                {video.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(video)}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                title="Edit video"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(video._id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete video"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

// Add/Edit Video Form Component
const VideoForm = ({ video, onSave, onCancel, isOpen }: {
  video: Video | null;
  onSave: (videoData: Partial<Video>) => void;
  onCancel: () => void;
  isOpen: boolean;
}) => {
  const [formData, setFormData] = useState<Partial<Video>>({
    title: '',
    description: '',
    thumbnail: '',
    videoUrl: '',
    duration: '',
    publishDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [extractingDuration, setExtractingDuration] = useState(false);
  const [showManualDuration, setShowManualDuration] = useState(false);
  const [showVideoMediaLibrary, setShowVideoMediaLibrary] = useState(false);
  const [showThumbnailMediaLibrary, setShowThumbnailMediaLibrary] = useState(false);


  // Helper function to format duration
  const formatDuration = (seconds: number | string): string => {
    if (!seconds || seconds === 0) {
      return 'Unknown duration';
    }
    
    const numSeconds = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    if (isNaN(numSeconds) || numSeconds <= 0) {
      return 'Unknown duration';
    }
    
    const hours = Math.floor(numSeconds / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    const secs = numSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        videoUrl: video.videoUrl,
        duration: video.duration,
        publishDate: video.publishDate.split('T')[0],
        isActive: video.isActive
      });
      setVideoPreview(video.videoUrl);
      setThumbnailPreview(video.thumbnail);
    } else {
      setFormData({
        title: '',
        description: '',
        thumbnail: '',
        videoUrl: '',
        duration: '',
        publishDate: new Date().toISOString().split('T')[0],
        isActive: true
      });
      setVideoPreview('');
      setThumbnailPreview('');
    }
    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setExtractingDuration(false);
    setShowManualDuration(false);
  }, [video, isOpen]);

  // File upload handlers
  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        const videoUrl = data.data.url;
        const thumbnailUrl = data.data.thumbnailUrl;
        const serverDuration = data.data.duration;
        
        setFormData(prev => ({ 
          ...prev, 
          videoUrl,
          thumbnail: thumbnailUrl || prev.thumbnail, // Use auto-generated thumbnail if available
          // Only update duration if we don't already have one from browser extraction
          duration: prev.duration && prev.duration !== 'Unknown duration' ? prev.duration : (serverDuration ? formatDuration(serverDuration) : 'Unknown duration')
        }));
        setVideoPreview(videoUrl);
        if (thumbnailUrl) {
          setThumbnailPreview(thumbnailUrl);
        }
        
        if (thumbnailUrl && serverDuration) {
          toast.success('Video uploaded successfully! Thumbnail and duration extracted automatically.');
        } else if (thumbnailUrl) {
          toast.success('Video uploaded successfully! Thumbnail generated automatically.');
        } else if (serverDuration) {
          toast.success('Video uploaded successfully! Duration extracted automatically. Please upload a thumbnail image.');
        } else {
          toast.success('Video uploaded successfully! Please upload a thumbnail image.');
        }
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        const thumbnailUrl = data.data.url;
        setFormData(prev => ({ ...prev, thumbnail: thumbnailUrl }));
        setThumbnailPreview(thumbnailUrl);
        toast.success('Thumbnail uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast.error('Failed to upload thumbnail. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedVideoFile(file);
      
      // Try to extract duration from video file using browser
      setExtractingDuration(true);
      const video = document.createElement('video');
      video.preload = 'metadata';
      let durationExtracted = false;
      
      const extractDuration = () => {
        if (durationExtracted) return;
        durationExtracted = true;
        setExtractingDuration(false);
        
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          const duration = formatDuration(Math.round(video.duration));
          setFormData(prev => ({ ...prev, duration }));
          toast.success(`Duration extracted: ${duration}`);
        } else {
          setFormData(prev => ({ ...prev, duration: 'Unknown duration' }));
        }
        // Clean up the object URL
        URL.revokeObjectURL(video.src);
      };
      
      video.onloadedmetadata = extractDuration;
      video.oncanplaythrough = extractDuration;
      
      video.onerror = (error) => {
        if (durationExtracted) return;
        durationExtracted = true;
        setExtractingDuration(false);
        setFormData(prev => ({ ...prev, duration: 'Unknown duration' }));
        URL.revokeObjectURL(video.src);
      };
      
      // Set a timeout as fallback
      setTimeout(() => {
        if (!durationExtracted) {
          durationExtracted = true;
          setExtractingDuration(false);
          setFormData(prev => ({ ...prev, duration: 'Unknown duration' }));
          URL.revokeObjectURL(video.src);
        }
      }, 5000); // 5 second timeout
      
      video.src = URL.createObjectURL(file);
      
      handleVideoUpload(file);
    }
  };

  const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedThumbnailFile(file);
      handleThumbnailUpload(file);
    }
  };

  // Media library handlers
  const handleVideoSelect = (asset: { url: string }) => {
    setFormData(prev => ({ ...prev, videoUrl: asset.url }));
    setVideoPreview(asset.url);
    setShowVideoMediaLibrary(false);
    toast.success('Video selected from media library!');
  };

  const handleThumbnailSelect = (asset: { url: string }) => {
    setFormData(prev => ({ ...prev, thumbnail: asset.url }));
    setThumbnailPreview(asset.url);
    setShowThumbnailMediaLibrary(false);
    toast.success('Thumbnail selected from media library!');
  };

  const removeVideo = () => {
    setFormData(prev => ({ ...prev, videoUrl: '' }));
    setVideoPreview('');
    setSelectedVideoFile(null);
  };

  const removeThumbnail = () => {
    setFormData(prev => ({ ...prev, thumbnail: '' }));
    setThumbnailPreview('');
    setSelectedThumbnailFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title) {
      toast.error('Please enter a video title');
      return;
    }
    
    if (!formData.videoUrl) {
      toast.error('Please upload a video file');
      return;
    }
    
    if (!formData.thumbnail) {
      toast.error('Please upload a thumbnail image or wait for auto-generation');
      return;
    }
    
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {video ? 'Edit Video' : 'Add New Video'}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {video ? 'Update video information' : 'Add a new video to the popular videos section'}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter video description"
                rows={3}
              />
            </div>
            
            {/* Video Upload Section */}
            <div className="lg:col-span-2">
              <Label className="text-base font-semibold text-gray-900">Video File *</Label>
              <p className="text-sm text-gray-500 mb-4">Upload your video file (MP4, MOV, AVI up to 100MB)</p>
              <div className="mt-2">
                {videoPreview ? (
                  <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-solid border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileVideo className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Video uploaded successfully</p>
                          <p className="text-xs text-gray-600">Click to replace with a different video</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeVideo}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <video 
                      src={videoPreview} 
                      className="w-full h-40 object-cover rounded-lg shadow-sm"
                      controls
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all duration-200 hover:shadow-md">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileVideo className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-base font-semibold text-gray-900 mb-2">
                        Select video from media library
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose from your uploaded videos
                      </p>
                      <Button
                        type="button"
                        onClick={() => setShowVideoMediaLibrary(true)}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <FileVideo className="w-4 h-4 mr-2" />
                        Select Video
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Upload Section */}
            <div className="lg:col-span-2">
              <Label className="text-base font-semibold text-gray-900">Thumbnail Image *</Label>
              <p className="text-sm text-gray-500 mb-4">Upload a thumbnail image or use the auto-generated one from your video</p>
              <div className="mt-2">
                {thumbnailPreview ? (
                  <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-solid border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className="w-12 h-12 object-cover rounded-lg shadow-sm"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Thumbnail uploaded successfully</p>
                          <p className="text-xs text-gray-600">Click to replace with a different image</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeThumbnail}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-dashed border-green-300 hover:border-green-400 transition-all duration-200 hover:shadow-md">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        Select thumbnail from media library
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        Choose from your uploaded images
                      </p>
                      <Button
                        type="button"
                        onClick={() => setShowThumbnailMediaLibrary(true)}
                        disabled={uploading}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Thumbnail
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Details Section */}
            <div className="lg:col-span-2">
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              </div>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration</Label>
              <div className="relative">
                <Input
                  id="duration"
                  value={extractingDuration ? 'Extracting duration...' : (formData.duration || 'Unknown duration')}
                  placeholder="Auto-filled from video"
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
                {extractingDuration && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {extractingDuration 
                  ? 'Extracting duration from video...'
                  : (formData.duration === 'Unknown duration' || !formData.duration || formData.duration === '') 
                    ? 'Duration extraction failed. This may be due to video format or browser limitations.'
                    : `Duration was automatically extracted: ${formData.duration}`
                }
              </p>
              {(formData.duration === 'Unknown duration' || !formData.duration) && !extractingDuration && (
                <button
                  type="button"
                  onClick={() => setShowManualDuration(!showManualDuration)}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1 underline"
                >
                  {showManualDuration ? 'Hide manual input' : 'Enter duration manually'}
                </button>
              )}
              {showManualDuration && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter duration (e.g., 2:30)"
                    value={formData.duration === 'Unknown duration' ? '' : formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: MM:SS or HH:MM:SS</p>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="publishDate">Publish Date</Label>
              <Input
                id="publishDate"
                type="date"
                value={formData.publishDate}
                onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 mt-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" 
                disabled={uploading || !formData.videoUrl}
              >
                {uploading ? 'Uploading...' : (video ? 'Update Video' : 'Add Video')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Media Library for Video Selection */}
      <MediaLibrary
        isOpen={showVideoMediaLibrary}
        onClose={() => setShowVideoMediaLibrary(false)}
        onSelect={handleVideoSelect}
        allowedTypes={['video']}
      />

      {/* Media Library for Thumbnail Selection */}
      <MediaLibrary
        isOpen={showThumbnailMediaLibrary}
        onClose={() => setShowThumbnailMediaLibrary(false)}
        onSelect={handleThumbnailSelect}
        allowedTypes={['image']}
      />
    </Dialog>
  );
};

export default function VideoManager() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchHomepageContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/v1/homepage-content?sectionType=popular-videos');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setHomepageContent(data.data[0]);
      } else {
        // Create default popular videos section if it doesn't exist
        const createResponse = await fetch('http://localhost:5000/api/v1/homepage-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sectionType: 'popular-videos',
            title: 'Popular Videos',
            description: 'Discover amazing travel videos',
            isActive: true,
            content: { videos: [] },
            displaySettings: {
              showTitle: true,
              showDescription: true,
              itemsPerRow: 4,
              maxItems: 8,
              showViewMore: true,
              viewMoreText: 'View More',
              viewMoreLink: '#'
            }
          })
        });
        
        const createData = await createResponse.json();
        if (createData.success) {
          setHomepageContent(createData.data);
        }
      }
    } catch (err) {
      setError('Error fetching videos');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await videoAnalyticsApi.getVideoAnalytics();
      if (data.success) {
        console.log('Analytics data:', data.data);
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchHomepageContent();
    fetchAnalytics();
  }, []);

  const handleAddVideo = async (videoData: Partial<Video>) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/homepage-content/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData)
      });
      
      const data = await response.json();
      if (data.success) {
        setHomepageContent(data.data);
        setShowVideoForm(false);
        toast.success('Video added successfully!');
      } else {
        toast.error('Failed to add video');
      }
    } catch (error) {
      toast.error('Error adding video');
      console.error('Error adding video:', error);
    }
  };

  const handleEditVideo = async (videoData: Partial<Video>) => {
    if (!editingVideo) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/homepage-content/videos/${editingVideo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData)
      });
      
      const data = await response.json();
      if (data.success) {
        setHomepageContent(data.data);
        setEditingVideo(null);
        toast.success('Video updated successfully!');
      } else {
        toast.error('Failed to update video');
      }
    } catch (error) {
      toast.error('Error updating video');
      console.error('Error updating video:', error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/homepage-content/videos/${videoId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setHomepageContent(data.data);
        toast.success('Video deleted successfully!');
      } else {
        toast.error('Failed to delete video');
      }
    } catch (error) {
      toast.error('Error deleting video');
      console.error('Error deleting video:', error);
    }
  };

  const handleToggleActive = async (videoId: string) => {
    if (!homepageContent) return;
    
    const video = homepageContent.content.videos.find(v => v._id === videoId);
    if (!video) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/homepage-content/videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !video.isActive })
      });
      
      const data = await response.json();
      if (data.success) {
        setHomepageContent(data.data);
        toast.success(`Video ${video.isActive ? 'deactivated' : 'activated'} successfully!`);
      } else {
        toast.error('Failed to toggle video status');
      }
    } catch (error) {
      toast.error('Error toggling video status');
      console.error('Error toggling video status:', error);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && homepageContent) {
      const oldIndex = homepageContent.content.videos.findIndex((video: Video) => video._id === active.id);
      const newIndex = homepageContent.content.videos.findIndex((video: Video) => video._id === over.id);
      
      const newVideos = [...homepageContent.content.videos];
      const [movedVideo] = newVideos.splice(oldIndex, 1);
      newVideos.splice(newIndex, 0, movedVideo);
      
      // Update order
      const reorderedVideos = newVideos.map((video, index) => ({
        ...video,
        order: index
      }));
      
      try {
        const response = await fetch('http://localhost:5000/api/v1/homepage-content/videos/reorder', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            videoIds: reorderedVideos.map(v => v._id) 
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setHomepageContent(data.data);
          toast.success('Videos reordered successfully!');
        }
      } catch (error) {
        toast.error('Error reordering videos');
        console.error('Error reordering videos:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Loading videos...</h3>
            <p className="mt-2 text-gray-600">Please wait while we fetch your videos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">Popular Videos</h1>
              <p className="text-gray-600">Manage videos for the popular videos section on your homepage</p>
              <p className="text-sm text-blue-600 font-medium">
                📊 Videos are automatically sorted by popularity (view count)
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  fetchHomepageContent();
                  fetchAnalytics();
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Refresh Analytics
              </Button>
              <Button 
                onClick={() => setShowVideoForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Video Analytics</h2>
            </div>
            <Button
              onClick={() => setShowAnalytics(!showAnalytics)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
            </Button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && analytics && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Play className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Videos</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalVideos}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalClicks.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.summary.averageCompletionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Video Performance</h3>
                <p className="text-sm text-gray-600">Ranked by view count</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.videos.map((video: any, index: number) => (
                      <tr key={video.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {video.thumbnail ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                                  src={video.thumbnail}
                                  alt={video.title}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center ${video.thumbnail ? 'hidden' : ''}`}>
                                <Play className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {video.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(video.publishDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {video.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {video.clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {video.completionRate.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={video.isActive ? "default" : "secondary"}>
                            {video.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {homepageContent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Videos</p>
                  <p className="text-2xl font-bold text-gray-900">{homepageContent.content.videos.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Videos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {homepageContent.content.videos.filter(v => v.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <EyeOff className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Inactive Videos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {homepageContent.content.videos.filter(v => !v.isActive).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Videos List */}
        <div className="space-y-4">
          {homepageContent && homepageContent.content.videos.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add your first video to start building your popular videos section.
              </p>
              <Button 
                onClick={() => setShowVideoForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={homepageContent?.content.videos.map(v => v._id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {homepageContent?.content.videos
                    .sort((a, b) => {
                      // Sort by view count (most popular first), then by order as fallback
                      const aViews = a.analytics?.views || 0;
                      const bViews = b.analytics?.views || 0;
                      if (aViews !== bViews) {
                        return bViews - aViews; // Descending order (most views first)
                      }
                      return a.order - b.order; // Fallback to original order
                    })
                    .map((video, index) => (
                      <SortableVideoItem
                        key={video._id}
                        video={video}
                        rank={index + 1}
                        onEdit={setEditingVideo}
                        onDelete={handleDeleteVideo}
                        onToggleActive={handleToggleActive}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Video Form */}
        <VideoForm
          video={editingVideo}
          onSave={editingVideo ? handleEditVideo : handleAddVideo}
          onCancel={() => {
            setEditingVideo(null);
            setShowVideoForm(false);
          }}
          isOpen={showVideoForm || !!editingVideo}
        />
      </div>
    </div>
  );
}
