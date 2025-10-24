'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import { MediaLibrary } from './MediaLibrary';
import type { MediaAsset } from '@/lib/api';

interface FeaturedImageSelectorProps {
  selectedImage: MediaAsset | null;
  onSelectImage: (image: MediaAsset | null) => void;
  onRemoveImage: () => void;
  className?: string;
}

export function FeaturedImageSelector({
  selectedImage,
  onSelectImage,
  onRemoveImage,
  className
}: FeaturedImageSelectorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);

  const handleImageSelect = (media: MediaAsset) => {
    // Only allow images
    if (media.mimeType?.startsWith('image/')) {
      onSelectImage(media);
      setShowMediaLibrary(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Featured Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedImage ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="w-full h-48 object-cover rounded-md"
                onLoad={() => console.log('Featured image loaded successfully:', selectedImage.filename)}
                onError={() => {
                  console.error('Featured image failed to load:', selectedImage.filename, selectedImage.url);
                }}
              />
              <Badge 
                variant="secondary" 
                className="absolute top-2 left-2"
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Image
              </Badge>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={onRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedImage.filename}</p>
              <p className="text-xs text-muted-foreground">
                {selectedImage.size && selectedImage.size > 0 
                  ? `${(selectedImage.size / 1024).toFixed(1)} KB` 
                  : 'Size unknown'
                }
                {selectedImage.width && selectedImage.height && (
                  <span className="ml-2">
                    • {selectedImage.width} × {selectedImage.height}
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
                Change Image
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
              Select Featured Image
            </h3>
            <p className="text-gray-500 mb-4">
              Choose an image to feature with your post
            </p>
            <Button type="button" variant="outline">
              Browse Images
            </Button>
          </div>
        )}

        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleImageSelect}
          selectedAssetId={selectedImage?.id}
          allowedTypes={['image']}
        />
      </CardContent>
    </Card>
  );
}
