'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Image as ImageIcon, Video, Play, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MediaLibrary } from './MediaLibrary';
import type { MediaAsset } from '@/lib/api';

interface FeaturedMediaSelectorProps {
  selectedMedia: MediaAsset | null;
  onSelectMedia: (media: MediaAsset | null) => void;
  onRemoveMedia: () => void;
  className?: string;
}

export function FeaturedMediaSelector({
  selectedMedia,
  onSelectMedia,
  onRemoveMedia,
  className
}: FeaturedMediaSelectorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = React.useState(false);

  const handleMediaSelect = (media: MediaAsset) => {
    onSelectMedia(media);
    setShowMediaLibrary(false);
  };

  const isVideo = selectedMedia?.mimeType?.startsWith('video/');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isVideo ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
          Featured Media
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedMedia ? (
          <div className="space-y-4">
            <div className="relative">
              {isVideo ? (
                <div className="relative w-full h-48 bg-black rounded-md overflow-hidden">
                  <video
                    src={selectedMedia.url}
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
              ) : (
                <div className="relative">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.filename}
                    className="w-full h-48 object-cover rounded-md"
                    onLoad={() => console.log('Featured media loaded successfully:', selectedMedia.filename)}
                    onError={() => {
                      console.error('Featured media failed to load:', selectedMedia.filename, selectedMedia.url);
                    }}
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2"
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Image
                  </Badge>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={onRemoveMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedMedia.filename}</p>
              <p className="text-xs text-muted-foreground">
                {selectedMedia.size && selectedMedia.size > 0 
                  ? `${(selectedMedia.size / 1024).toFixed(1)} KB` 
                  : 'Size unknown'
                }
                {isVideo && selectedMedia.duration && (
                  <span className="ml-2">
                    • {Math.floor(selectedMedia.duration / 60)}:{(selectedMedia.duration % 60).toString().padStart(2, '0')}
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
                Change Media
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
              Select Featured Media
            </h3>
            <p className="text-gray-500 mb-4">
              Choose an image or video to feature with your post
            </p>
            <Button type="button" variant="outline">
              Browse Media Library
            </Button>
          </div>
        )}

        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleMediaSelect}
          selectedAssetId={selectedMedia?.id}
          allowedTypes={['image', 'video']}
        />

        {/* Video Player Modal */}
        <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {selectedMedia?.filename}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4">
              {selectedMedia && (
                <div className="relative w-full">
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[70vh] rounded-lg"
                    onError={(e) => {
                      console.error('Video playback failed:', selectedMedia.filename);
                      const target = e.target as HTMLVideoElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex flex-col items-center justify-center text-muted-foreground w-full h-64 rounded-lg bg-muted">
                            <Video class="h-12 w-12 mb-4" />
                            <p class="text-lg font-medium">Video Playback Failed</p>
                            <p class="text-sm">Unable to load video: ${selectedMedia.filename}</p>
                          </div>
                        `;
                      }
                    }}
                  />
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p><strong>File:</strong> {selectedMedia.filename}</p>
                    <p><strong>Size:</strong> {selectedMedia.size ? `${(selectedMedia.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
                    {selectedMedia.width && selectedMedia.height && (
                      <p><strong>Dimensions:</strong> {selectedMedia.width} × {selectedMedia.height}</p>
                    )}
                    {selectedMedia.duration && (
                      <p><strong>Duration:</strong> {Math.floor(selectedMedia.duration / 60)}:{(selectedMedia.duration % 60).toString().padStart(2, '0')}</p>
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
