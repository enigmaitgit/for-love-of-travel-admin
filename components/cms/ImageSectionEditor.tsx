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
import { getImageDisplayUrl } from '@/lib/image-utils';

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

  // Ensure section has proper default values
  const safeSection = React.useMemo(() => ({
    imageUrl: section.imageUrl || '',
    altText: section.altText || '',
    caption: section.caption || '',
    alignment: section.alignment || 'center',
    rounded: section.rounded ?? true,
    shadow: section.shadow ?? true,
    width: section.width,
    height: section.height
  }), [section]);

  // Load media assets to resolve IDs to URLs
  React.useEffect(() => {
    const loadMediaAssets = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/v1/media`);
        const responseData = await response.json();
        const data = responseData.data || responseData;
        setMediaAssets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading media assets:', error);
      }
    };
    loadMediaAssets();
  }, []);

  // Helper function to resolve asset ID to URL for display
  const resolveImageUrl = (imageUrl: string | undefined): string => {
    return getImageDisplayUrl(imageUrl || '');
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

    const resolvedImageUrl = resolveImageUrl(safeSection.imageUrl);
    
    return (
      <div className={cn('space-y-2', alignmentClasses[safeSection.alignment])}>
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={safeSection.altText || 'Image'}
            className={cn(
              'max-w-full h-auto object-contain',
              safeSection.rounded && 'rounded-lg',
              safeSection.shadow && 'shadow-lg'
            )}
            style={{
              width: safeSection.width ? `${safeSection.width}px` : 'auto',
              height: safeSection.height ? `${safeSection.height}px` : 'auto'
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
        {safeSection.caption && (
          <p className="text-sm text-muted-foreground italic">
            {safeSection.caption}
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
              value={safeSection.imageUrl}
              onChange={(e) => updateSection({ imageUrl: e.target.value })}
              placeholder="Image URL or select from media library"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMediaLibrary(true)}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image Preview */}
        {(() => {
          const resolvedImageUrl = resolveImageUrl(safeSection.imageUrl);
          return resolvedImageUrl ? (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative w-full max-w-md">
                <img
                  src={resolvedImageUrl}
                  alt="Image preview"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            </div>
          ) : null;
        })()}

        {/* Alt Text */}
        <div className="space-y-2">
          <Label>Alt Text</Label>
          <Input
            value={safeSection.altText}
            onChange={(e) => updateSection({ altText: e.target.value })}
            placeholder="Describe the image for accessibility"
          />
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label>Caption (Optional)</Label>
          <Input
            value={safeSection.caption}
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
              value={safeSection.width || ''}
              onChange={(e) => updateSection({ width: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Auto"
            />
          </div>
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={safeSection.height || ''}
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
                variant={safeSection.alignment === value ? 'secondary' : 'outline'}
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
              checked={safeSection.rounded}
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
              checked={safeSection.shadow}
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onClose}>
            Save Section
          </Button>
        </div>
      </CardContent>

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(asset) => {
          // Store the asset URL for proper image rendering
          updateSection({ imageUrl: asset.url });
          setShowMediaLibrary(false);
        }}
      />
    </Card>
  );
}



