"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, Eye, Save, Image, Video } from 'lucide-react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { getBackendUrl } from '@/lib/api-config';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import { MediaAsset } from '@/lib/api';

interface FeaturedVideo {
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  publishDate: string;
  isActive: boolean;
  analytics: {
    views: number;
    clicks: number;
    playTime: number;
    completionRate: number;
    lastViewed: string;
  };
}

interface FeaturedVideoContent {
  _id: string;
  sectionType: string;
  title: string;
  description: string;
  isActive: boolean;
  content: {
    featuredVideo: FeaturedVideo;
  };
  displaySettings: Record<string, unknown>;
  styling: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Utility function to format duration from seconds to MM:SS or HH:MM:SS
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

export default function FeaturedVideoManager() {
  const { showSnackbar } = useSnackbar();
  const [featuredVideoContent, setFeaturedVideoContent] = useState<FeaturedVideoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showThumbnailLibrary, setShowThumbnailLibrary] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    videoUrl: '',
    duration: '',
    isActive: true
  });

  useEffect(() => {
    fetchFeaturedVideo();
  }, []);

  const fetchFeaturedVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getBackendUrl('api/v1/homepage-content/featured-video'), { 
        cache: 'no-store', 
        credentials: 'include' 
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setFeaturedVideoContent(data.data);
        const video = data.data.content.featuredVideo;
        setFormData({
          title: video.title || '',
          description: video.description || '',
          thumbnail: video.thumbnail || '',
          videoUrl: video.videoUrl || '',
          duration: video.duration || '',
          isActive: video.isActive !== undefined ? video.isActive : true
        });
        
        // Log the loaded state for debugging
        console.log('Loaded featured video data:', {
          title: video.title,
          isActive: video.isActive,
          formDataIsActive: video.isActive !== undefined ? video.isActive : true
        });
      } else {
        // Initialize with default values if no featured video exists
        setFormData({
          title: 'Featured Video',
          description: 'Main featured video for the homepage',
          thumbnail: '',
          videoUrl: '',
          duration: '',
          isActive: true
        });
      }
    } catch (err) {
      console.error('Error fetching featured video:', err);
      setError('Failed to load featured video');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Debug logging
      console.log('Saving featured video with formData:', formData);
      console.log('Featured video isActive:', formData.isActive);

      const payload = {
        title: 'Featured Video',
        description: 'Main featured video section of the homepage',
        isActive: true,
        featuredVideo: {
          ...formData,
          publishDate: new Date().toISOString(),
          analytics: {
            views: 0,
            clicks: 0,
            playTime: 0,
            completionRate: 0
          }
        }
      };

      console.log('Sending payload:', payload);

      const response = await fetch(getBackendUrl('api/v1/homepage-content/featured-video'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (data.success) {
        setFeaturedVideoContent(data.data);
        const videoIsActive = data.data?.content?.featuredVideo?.isActive;
        console.log('Featured video isActive after save:', videoIsActive);
        
        if (videoIsActive) {
          showSnackbar('Featured video saved and activated successfully!', 'success');
        } else {
          showSnackbar('Featured video saved but is currently inactive. It will not appear on the website.', 'warning');
        }
      } else {
        throw new Error(data.message || 'Failed to save featured video');
      }
    } catch (err) {
      console.error('Error saving featured video:', err);
      setError(err instanceof Error ? err.message : 'Failed to save featured video');
      showSnackbar('Failed to save featured video', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailSelect = (asset: MediaAsset) => {
    handleInputChange('thumbnail', asset.url);
    setShowThumbnailLibrary(false);
    showSnackbar('Thumbnail selected successfully!', 'success');
  };

  const handleVideoSelect = (asset: MediaAsset) => {
    handleInputChange('videoUrl', asset.url);
    
    // Auto-detect and set duration if available
    if (asset.duration) {
      const formattedDuration = formatDuration(asset.duration);
      handleInputChange('duration', formattedDuration);
      showSnackbar(`Video selected! Duration: ${formattedDuration}`, 'success');
    } else {
      showSnackbar('Video selected successfully!', 'success');
    }
    
    setShowVideoLibrary(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading featured video...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Featured Video Management</h1>
          <p className="text-gray-600 mt-2">
            Manage the main featured video displayed on the homepage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? 'Edit' : 'Preview'}</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warning Message for Inactive Video */}
      {!formData.isActive && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Warning:</strong> The featured video is currently inactive. It will not appear on the website until you activate it using the toggle above.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Top Row: Video Information and Analytics side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Information</CardTitle>
                <CardDescription>
                  Configure the featured video details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter video title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter video description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (MM:SS)</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="Auto-detected when video is selected from library"
                  />
                  {!formData.duration && formData.videoUrl && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration will be auto-detected when you select a video from the media library
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <Label htmlFor="isActive" className="text-base font-medium">
                      Video Status
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.isActive 
                        ? 'Video is active and will appear on the website' 
                        : 'Video is inactive and will not appear on the website'
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive" className="font-medium">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media Files</CardTitle>
                <CardDescription>
                  Upload thumbnail and video files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="thumbnail">Thumbnail Image</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="thumbnail"
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                      placeholder="Thumbnail URL or select from library"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowThumbnailLibrary(true)}
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="h-4 w-4 mr-2" />
                      Select
                    </Button>
                  </div>
                  {formData.thumbnail && (
                    <div className="mt-2">
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail preview"
                        className="w-32 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="videoUrl"
                      value={formData.videoUrl}
                      onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                      placeholder="Video URL or select from library"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVideoLibrary(true)}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Select
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          {featuredVideoContent && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Video performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {featuredVideoContent.content.featuredVideo.analytics.views}
                    </div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {featuredVideoContent.content.featuredVideo.analytics.clicks}
                    </div>
                    <div className="text-sm text-gray-600">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(featuredVideoContent.content.featuredVideo.analytics.completionRate)}%
                    </div>
                    <div className="text-sm text-gray-600">Completion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(featuredVideoContent.content.featuredVideo.analytics.playTime / 60)}m
                    </div>
                    <div className="text-sm text-gray-600">Play Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Row: Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How the featured video will appear on the homepage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] rounded-xl sm:rounded-2xl overflow-hidden shadow-smooth group cursor-pointer">
              {formData.thumbnail ? (
                <img
                  src={formData.thumbnail}
                  alt={formData.title || 'Featured video'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No thumbnail uploaded</span>
                </div>
              )}
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-gray-800 ml-1" />
                </div>
              </div>
            </div>
            
            {formData.title && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900">{formData.title}</h3>
                {formData.description && (
                  <p className="text-gray-600 mt-1">{formData.description}</p>
                )}
                {formData.duration && (
                  <Badge variant="secondary" className="mt-2">
                    {formData.duration}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Media Library Modals */}
      <MediaLibrary
        isOpen={showThumbnailLibrary}
        onClose={() => setShowThumbnailLibrary(false)}
        onSelect={handleThumbnailSelect}
        allowedTypes={['image']}
      />

      <MediaLibrary
        isOpen={showVideoLibrary}
        onClose={() => setShowVideoLibrary(false)}
        onSelect={handleVideoSelect}
        allowedTypes={['video']}
      />
    </div>
  );
}
