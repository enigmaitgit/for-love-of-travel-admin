'use client';

import * as React from 'react';
import { X, Eye, Image, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GallerySection } from '@/lib/validation';
import { MediaLibrary } from './MediaLibrary';
import { getImageDisplayUrl } from '@/lib/image-utils';

interface GallerySectionEditorProps {
  section: GallerySection;
  onChange: (section: GallerySection) => void;
  onClose: () => void;
}

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'carousel', label: 'Carousel' }
];

const SPACING_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const COLUMN_OPTIONS = [
  { value: 1, label: '1 Column' },
  { value: 2, label: '2 Columns' },
  { value: 3, label: '3 Columns' },
  { value: 4, label: '4 Columns' },
  { value: 5, label: '5 Columns' },
  { value: 6, label: '6 Columns' }
];

export function GallerySectionEditor({ section, onChange, onClose }: GallerySectionEditorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);

  // Ensure section has proper default values
  const safeSection = React.useMemo(() => ({
    images: Array.isArray(section.images) ? section.images : [],
    layout: section.layout || 'grid',
    columns: section.columns || 3,
    spacing: section.spacing || 'md',
    responsive: section.responsive || {
      mobile: { layout: 'grid', columns: 2 },
      desktop: { layout: 'grid', columns: 3 }
    },
    hoverEffects: section.hoverEffects || {
      enabled: true,
      scale: 1.03,
      shadow: true,
      overlay: true
    },
    animation: section.animation || {
      enabled: true,
      type: 'fadeIn',
      duration: 0.5,
      stagger: 0.1
    }
  }), [section]);

  const updateSection = (updates: Partial<GallerySection>) => {
    onChange({ ...section, ...updates });
  };

  const addImage = (url: string, altText?: string) => {
    console.log('GallerySectionEditor - Adding image to gallery:', { 
      url, 
      altText, 
      currentImages: safeSection.images.length,
      urlType: url ? (url.startsWith('data:') ? 'data' : url.startsWith('http') ? 'http' : 'other') : 'empty'
    });
    // Store the original URL for display purposes - sanitization happens during save
    const newImage = {
      url: url, // Keep original URL for preview
      altText: altText || '',
      caption: ''
    };
    console.log('GallerySectionEditor - New image object:', newImage);
    updateSection({
      images: [...safeSection.images, newImage]
    });
  };

  const updateImage = (index: number, updates: Partial<NonNullable<GallerySection['images']>[0]>) => {
    const newImages = [...safeSection.images];
    newImages[index] = { ...newImages[index], ...updates };
    updateSection({ images: newImages });
  };

  const removeImage = (index: number) => {
    const newImages = safeSection.images.filter((_, i) => i !== index);
    updateSection({ images: newImages });
  };

  const renderPreview = () => {
    if (safeSection.images.length === 0) {
      return (
        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="w-12 h-12 mx-auto mb-2" />
            <p>No images in gallery</p>
          </div>
        </div>
      );
    }

    const gridClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    };

    const spacingClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6'
    };

    return (
      <div className={cn(
        'grid',
        gridClasses[safeSection.columns as keyof typeof gridClasses],
        spacingClasses[safeSection.spacing as keyof typeof spacingClasses]
      )}>
        {safeSection.images.map((image, index) => {
          const imageUrl = getImageDisplayUrl(image.url || '');
          return (
            <div key={index} className="relative group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={image.altText || `Gallery image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 rounded-b-lg">
                  {image.caption}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Gallery Section Preview</CardTitle>
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
        <CardTitle>Gallery Section Editor</CardTitle>
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
        {/* Layout Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={safeSection.layout}
              onValueChange={(value) => updateSection({ layout: value as 'grid' | 'masonry' | 'carousel' | 'postcard' | 'complex' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Columns</Label>
            <Select
              value={safeSection.columns.toString()}
              onValueChange={(value) => updateSection({ columns: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value.toString()}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-2">
          <Label>Spacing</Label>
          <Select
            value={safeSection.spacing}
            onValueChange={(value) => updateSection({ spacing: value as 'sm' | 'md' | 'lg' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPACING_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Images */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Images ({safeSection.images.length})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMediaLibrary(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Images
            </Button>
          </div>
        </div>

        {/* Images List */}
        {safeSection.images.length > 0 && (
          <div className="space-y-3">
            {safeSection.images.map((image, index) => {
              const imageUrl = getImageDisplayUrl(image.url || '');
              return (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={image.altText || `Image ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={image.altText}
                      onChange={(e) => updateImage(index, { altText: e.target.value })}
                      placeholder="Alt text"
                      className="text-sm"
                    />
                    <Input
                      value={image.caption}
                      onChange={(e) => updateImage(index, { caption: e.target.value })}
                      placeholder="Caption (optional)"
                      className="text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

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
          console.log('GallerySectionEditor - MediaLibrary asset selected:', asset);
          // Use the asset URL directly - it should be a proper URL from the backend
          addImage(asset.url, (asset as { altText?: string }).altText || '');
          setShowMediaLibrary(false);
        }}
      />
    </Card>
  );
}



