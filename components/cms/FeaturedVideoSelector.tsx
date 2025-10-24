'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Video, Play, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MediaLibrary } from './MediaLibrary';
import type { MediaAsset } from '@/lib/api';

interface FeaturedVideoSelectorProps {
  selectedVideo: MediaAsset | null;
  onSelectVideo: (video: MediaAsset | null) => void;
  onRemoveVideo: () => void;
  className?: string;
}

export function FeaturedVideoSelector({
  selectedVideo,
  onSelectVideo,
  onRemoveVideo,
  className
}: FeaturedVideoSelectorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = React.useState(false);

  const handleVideoSelect = (media: MediaAsset) => {
    // Only allow videos
    if (media.mimeType?.startsWith('video/')) {
      onSelectVideo(media);
      setShowMediaLibrary(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Featured Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedVideo ? (
          <div className="space-y-4">
            <div className="relative">
              <div className="relative w-full h-48 bg-black rounded-md overflow-hidden">
                <video
                  src={selectedVideo.url}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  preload="metadata"
                />
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={() => setShowVideoPlayer(true)}
                >
                  <div className="bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2"
                >
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={onRemoveVideo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedVideo.filename}</p>
              <p className="text-xs text-muted-foreground">
                {selectedVideo.size && selectedVideo.size > 0 
                  ? `${(selectedVideo.size / 1024).toFixed(1)} KB` 
                  : 'Size unknown'
                }
                {selectedVideo.duration && (
                  <span className="ml-2">
                    • {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMediaLibrary(true)} 
                className="w-full"
              >
                Change Video
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => setShowMediaLibrary(true)}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Featured Video
            </h3>
            <p className="text-gray-500 mb-4">
              Choose a video to feature with your post
            </p>
            <Button type="button" variant="outline">
              Browse Videos
            </Button>
          </div>
        )}

        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleVideoSelect}
          selectedAssetId={selectedVideo?.id}
          allowedTypes={['video']}
        />

        {/* Video Player Modal */}
        <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {selectedVideo?.filename}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4">
              {selectedVideo && (
                <div className="relative w-full">
                  <video
                    src={selectedVideo.url}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[70vh] rounded-lg"
                    onError={(e) => {
                      console.error('Video playback failed:', selectedVideo.filename);
                      const target = e.target as HTMLVideoElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center text-muted-foreground w-full h-64 rounded-lg bg-muted">
                            <Video class="h-12 w-12 mb-4" />
                            <p class="text-lg font-medium">Video Playback Failed</p>
                            <p class="text-sm">Unable to load video: ${selectedVideo.filename}</p>
                          </div>
                        `;
                      }
                    }}
                  />
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p><strong>File:</strong> {selectedVideo.filename}</p>
                    <p><strong>Size:</strong> {selectedVideo.size ? `${(selectedVideo.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
                    {selectedVideo.width && selectedVideo.height && (
                      <p><strong>Dimensions:</strong> {selectedVideo.width} × {selectedVideo.height}</p>
                    )}
                    {selectedVideo.duration && (
                      <p><strong>Duration:</strong> {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
