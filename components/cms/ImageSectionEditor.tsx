'use client';

import * as React from 'react';
import { X, Eye, Image, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ImageSection } from '@/lib/validation';
import { MediaLibrary } from './MediaLibrary';
import { MediaAsset } from '@/lib/api';

interface ImageSectionEditorProps {
  section: ImageSection;
  onChange: (section: ImageSection) => void;
  onClose: () => void;
}

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight }
];

export function ImageSectionEditor({ section, onChange, onClose }: ImageSectionEditorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [mediaAssets, setMediaAssets] = React.useState<MediaAsset[]>([]);

  // Load media assets to resolve IDs to URLs
  React.useEffect(() => {
    const loadMediaAssets = async () => {
      try {
        const response = await fetch('/api/admin/media');
        const data = await response.json();
        setMediaAssets(data);
      } catch (error) {
        console.error('Error loading media assets:', error);
      }
    };
    loadMediaAssets();
  }, []);

  // Helper function to resolve asset ID to URL
  const resolveImageUrl = (imageUrl: string): string => {
    // If it's already a full URL (http/https) or data URL, return as is
    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    // Otherwise, try to resolve from media assets
    const asset = mediaAssets.find(a => a.id === imageUrl);
    return asset ? asset.url : imageUrl;
  };

  const updateSection = (updates: Partial<ImageSection>) => {
    onChange({ ...section, ...updates });
  };

  const renderPreview = () => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };

    const resolvedImageUrl = resolveImageUrl(section.imageUrl);
    
    return (
      <div className={cn('space-y-2', alignmentClasses[section.alignment])}>
        {section.imageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={section.altText || 'Image'}
            className={cn(
              'max-w-full h-auto object-contain',
              section.rounded && 'rounded-lg',
              section.shadow && 'shadow-lg'
            )}
            style={{
              width: section.width ? `${section.width}px` : 'auto',
              height: section.height ? `${section.height}px` : 'auto'
            }}
          />
        ) : (
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-12 h-12 mx-auto mb-2" />
              <p>No image selected</p>
            </div>
          </div>
        )}
        {section.caption && (
          <p className="text-sm text-muted-foreground italic">
            {section.caption}
          </p>
        )}
      </div>
    );
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Image Section Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 border rounded-lg bg-muted/20">
            {renderPreview()}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Image Section Editor</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image URL */}
        <div className="space-y-2">
          <Label>Image URL</Label>
          <div className="flex items-center gap-2">
            <Input
              value={section.imageUrl}
              onChange={(e) => updateSection({ imageUrl: e.target.value })}
              placeholder="Image URL or select from media library"
            />
            <Button
              variant="outline"
              onClick={() => setShowMediaLibrary(true)}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image Preview */}
        {section.imageUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative w-full max-w-md">
              <img
                src={resolveImageUrl(section.imageUrl)}
                alt="Image preview"
                className="w-full h-auto rounded-lg border"
              />
            </div>
          </div>
        )}

        {/* Alt Text */}
        <div className="space-y-2">
          <Label>Alt Text</Label>
          <Input
            value={section.altText || ''}
            onChange={(e) => updateSection({ altText: e.target.value })}
            placeholder="Describe the image for accessibility"
          />
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label>Caption (Optional)</Label>
          <Input
            value={section.caption || ''}
            onChange={(e) => updateSection({ caption: e.target.value })}
            placeholder="Image caption"
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Width (px)</Label>
            <Input
              type="number"
              value={section.width || ''}
              onChange={(e) => updateSection({ width: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Auto"
            />
          </div>
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={section.height || ''}
              onChange={(e) => updateSection({ height: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Auto"
            />
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="flex gap-2">
            {ALIGNMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={section.alignment === value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSection({ alignment: value as 'left' | 'center' | 'right' })}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Styling Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Rounded Corners</Label>
              <p className="text-sm text-muted-foreground">
                Add rounded corners to the image
              </p>
            </div>
            <Switch
              checked={section.rounded}
              onCheckedChange={(checked) => updateSection({ rounded: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Drop Shadow</Label>
              <p className="text-sm text-muted-foreground">
                Add a subtle shadow to the image
              </p>
            </div>
            <Switch
              checked={section.shadow}
              onCheckedChange={(checked) => updateSection({ shadow: checked })}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div className="p-4 border rounded-lg bg-muted/20">
            {renderPreview()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Save Section
          </Button>
        </div>
      </CardContent>

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(asset) => {
          // Store the asset ID instead of the full data URL to avoid performance issues
          updateSection({ imageUrl: asset.id });
          setShowMediaLibrary(false);
        }}
      />
    </Card>
  );
}



