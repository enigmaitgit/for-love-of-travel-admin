'use client';

import * as React from 'react';
import { X, Eye, Image, Type, Upload, Trash2, Layout, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ArticleWithImageSection } from '@/lib/validation';
import { RichTextEditor } from './RichTextEditor';
import { MediaLibrary } from './MediaLibrary';

interface ArticleWithImageEditorProps {
  section: ArticleWithImageSection;
  onChange: (section: ArticleWithImageSection) => void;
  onClose: () => void;
}

const IMAGE_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }
];

const ANIMATION_TYPE_OPTIONS = [
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'none', label: 'None' }
];

export function ArticleWithImageEditor({ section, onChange, onClose }: ArticleWithImageEditorProps) {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState<number | null>(null);
  const [isPinnedImageOpen, setIsPinnedImageOpen] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);

  // Safe section with defaults
  const safeSection = React.useMemo(() => ({
    type: 'article' as const,
    title: section.title || '',
    content: section.content || '',
    changingImages: section.changingImages || [
      { url: '', altText: '', caption: '', order: 0 },
      { url: '', altText: '', caption: '', order: 1 },
      { url: '', altText: '', caption: '', order: 2 }
    ],
    pinnedImage: section.pinnedImage || { url: '', altText: '', caption: '' },
    layout: {
      imageSize: (section.layout?.imageSize || 'medium') as 'small' | 'medium' | 'large',
      showPinnedImage: section.layout?.showPinnedImage ?? true,
      showChangingImages: section.layout?.showChangingImages ?? true
    },
    animation: {
      enabled: section.animation?.enabled ?? true,
      type: (section.animation?.type || 'fadeIn') as 'fadeIn' | 'slideUp' | 'none',
      duration: section.animation?.duration || 0.5,
      delay: section.animation?.delay || 0
    }
  }), [section]);

  const updateSection = (updates: Partial<ArticleWithImageSection>) => {
    const updated = { ...safeSection, ...updates };
    console.log('ArticleEditor: Updating section:', updated);
    onChange(updated);
  };

  const updateChangingImage = (index: number, updates: Partial<NonNullable<ArticleWithImageSection['changingImages']>[0]>) => {
    const newChangingImages = [...safeSection.changingImages];
    newChangingImages[index] = { ...newChangingImages[index], ...updates };
    updateSection({ changingImages: newChangingImages });
  };

  const updatePinnedImage = (updates: Partial<ArticleWithImageSection['pinnedImage']>) => {
    updateSection({ pinnedImage: { ...safeSection.pinnedImage, ...updates } });
  };

  const updateLayout = (updates: Partial<ArticleWithImageSection['layout']>) => {
    updateSection({ layout: { ...safeSection.layout, ...updates } });
  };

  const updateAnimation = (updates: Partial<ArticleWithImageSection['animation']>) => {
    updateSection({ animation: { ...safeSection.animation, ...updates } });
  };

  const handleMediaSelect = (asset: { url: string }) => {
    const mediaUrl = asset.url;
    if (currentImageIndex !== null) {
      updateChangingImage(currentImageIndex, { url: mediaUrl });
    } else if (isPinnedImageOpen) {
      updatePinnedImage({ url: mediaUrl });
    }
    setIsMediaLibraryOpen(false);
    setCurrentImageIndex(null);
    setIsPinnedImageOpen(false);
  };

  const renderPreview = () => {
    const { title, content, changingImages, pinnedImage, layout } = safeSection;
    
    return (
      <article className="space-y-8">
        {/* Article Header */}
        <header className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight text-foreground">
            {title || 'Article Title'}
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none text-foreground">
          <div dangerouslySetInnerHTML={{ __html: content || '<p class="text-muted-foreground">Article content will appear here...</p>' }} />
        </div>

        {/* Images Section */}
        {(layout.showPinnedImage || layout.showChangingImages) && (
          <section className="space-y-6">
            {/* Pinned Image */}
            {layout.showPinnedImage && pinnedImage?.url && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl shadow-lg">
                  <img
                    src={pinnedImage.url}
                    alt={pinnedImage.altText || 'Pinned image'}
                    className={cn(
                      'w-full object-cover transition-transform duration-300 hover:scale-105',
                      layout.imageSize === 'small' ? 'h-48' : 
                      layout.imageSize === 'large' ? 'h-80' : 'h-64'
                    )}
                  />
                  {pinnedImage.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white text-sm font-medium">{pinnedImage.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Changing Images */}
            {layout.showChangingImages && changingImages.some(img => img.url) && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Gallery</h3>
                <div className="grid grid-cols-3 gap-4">
                  {changingImages.map((image: NonNullable<ArticleWithImageSection['changingImages']>[0], index: number) => (
                    <div key={index} className="group relative overflow-hidden rounded-lg shadow-md">
                      {image.url ? (
                        <>
                          <img
                            src={image.url}
                            alt={image.altText || `Changing image ${index + 1}`}
                            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {image.caption && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex items-end p-2">
                              <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {image.caption}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                          <div className="text-center">
                            <Image className="w-8 h-8 text-muted-foreground mx-auto mb-1" alt="" />
                            <p className="text-xs text-muted-foreground">Empty</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </article>
    );
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Article Preview
          </CardTitle>
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
          <div className="p-8 border rounded-lg bg-gradient-to-br from-muted/30 to-muted/10">
            <div className="max-w-4xl mx-auto">
              {renderPreview()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Article with Images Editor</CardTitle>
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
      <CardContent>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" alt="" />
              Images
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="animation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Animation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-6">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={safeSection.title}
                onChange={(e) => updateSection({ title: e.target.value })}
                placeholder="Enter article title..."
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                content={safeSection.content}
                onChange={(content) => updateSection({ content })}
                placeholder="Write your article content here..."
                className="min-h-[300px]"
              />
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label>Live Preview</Label>
              <div className="p-4 border rounded-lg bg-muted/20 max-h-64 overflow-y-auto">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">{safeSection.title || 'Article Title'}</h2>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: safeSection.content || '<p>Article content will appear here...</p>' }} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6 mt-6">

            {/* Pinned Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-4 h-4" alt="" />
                  Pinned Image
                  {safeSection.pinnedImage?.url && (
                    <span className="ml-auto text-xs text-green-600 font-normal">✓ Configured</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {safeSection.pinnedImage?.url ? (
                    <div className="relative group">
                      <img
                        src={safeSection.pinnedImage.url}
                        alt={safeSection.pinnedImage.altText || 'Pinned image'}
                        className="w-40 h-32 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => updatePinnedImage({ url: '', altText: '', caption: '' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-40 h-32 bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25">
                      <Image className="w-8 h-8 text-muted-foreground mb-2" alt="" />
                      <span className="text-xs text-muted-foreground text-center">No image selected</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPinnedImageOpen(true);
                        setIsMediaLibraryOpen(true);
                      }}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {safeSection.pinnedImage?.url ? 'Change Image' : 'Select Image'}
                    </Button>
                    
                    <div className="space-y-2">
                      <Label>Alt Text</Label>
                      <Input
                        value={safeSection.pinnedImage?.altText || ''}
                        onChange={(e) => updatePinnedImage({ altText: e.target.value })}
                        placeholder="Describe the image for accessibility..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Caption</Label>
                      <Input
                        value={safeSection.pinnedImage?.caption || ''}
                        onChange={(e) => updatePinnedImage({ caption: e.target.value })}
                        placeholder="Optional image caption..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changing Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-4 h-4" alt="" />
                  Changing Images
                  <span className="ml-auto text-xs text-muted-foreground">
                    {safeSection.changingImages.filter(img => img.url).length}/3 configured
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {safeSection.changingImages.map((image: NonNullable<ArticleWithImageSection['changingImages']>[0], index: number) => (
                    <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {image.url ? (
                          <div className="relative group">
                            <img
                              src={image.url}
                              alt={image.altText || `Changing image ${index + 1}`}
                              className="w-24 h-20 object-cover rounded-lg border"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 w-6 p-0"
                                onClick={() => updateChangingImage(index, { url: '', altText: '', caption: '' })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-20 bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25">
                            <Image className="w-6 h-6 text-muted-foreground mb-1" alt="" />
                            <span className="text-xs text-muted-foreground">Empty</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Label>Image {index + 1}</Label>
                          {image.url && (
                            <span className="text-xs text-green-600">✓ Configured</span>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setIsMediaLibraryOpen(true);
                          }}
                          className="w-full"
                        >
                          <Upload className="w-3 h-3 mr-2" />
                          {image.url ? 'Change Image' : 'Select Image'}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label>Alt Text</Label>
                            <Input
                              value={image.altText || ''}
                              onChange={(e) => updateChangingImage(index, { altText: e.target.value })}
                              placeholder="Alt text..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Caption</Label>
                            <Input
                              value={image.caption || ''}
                              onChange={(e) => updateChangingImage(index, { caption: e.target.value })}
                              placeholder="Caption..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <strong>Note:</strong> All 3 changing images are required for the rotating effect to work properly.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6 mt-6">
            {/* Image Size */}
            <div className="space-y-2">
              <Label>Image Size</Label>
              <Select
                value={safeSection.layout.imageSize}
                onValueChange={(value: 'small' | 'medium' | 'large') => 
                  updateLayout({ imageSize: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Display Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Display Options</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Pinned Image</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the main pinned image
                    </p>
                  </div>
                  <Switch
                    checked={safeSection.layout.showPinnedImage}
                    onCheckedChange={(checked) => updateLayout({ showPinnedImage: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Changing Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the rotating changing images
                    </p>
                  </div>
                  <Switch
                    checked={safeSection.layout.showChangingImages}
                    onCheckedChange={(checked) => updateLayout({ showChangingImages: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Layout Preview */}
            <div className="space-y-2">
              <Label>Layout Preview</Label>
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Article Layout</div>
                  <div className="space-y-2">
                    {safeSection.layout.showPinnedImage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={cn(
                          'bg-primary/20 rounded',
                          safeSection.layout.imageSize === 'small' ? 'w-8 h-6' : 
                          safeSection.layout.imageSize === 'large' ? 'w-16 h-12' : 'w-12 h-8'
                        )} />
                        <span>Pinned Image ({safeSection.layout.imageSize})</span>
                      </div>
                    )}
                    {safeSection.layout.showChangingImages && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <div className="w-4 h-3 bg-primary/20 rounded" />
                          <div className="w-4 h-3 bg-primary/20 rounded" />
                          <div className="w-4 h-3 bg-primary/20 rounded" />
                        </div>
                        <span>Changing Images (3)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="animation" className="space-y-6 mt-6">
            {/* Enable Animation */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Enable Animation</Label>
              <Switch
                checked={safeSection.animation.enabled}
                onCheckedChange={(checked) => updateAnimation({ enabled: checked })}
              />
            </div>

            {safeSection.animation.enabled && (
              <div className="space-y-6">
                {/* Animation Type */}
                <div className="space-y-2">
                  <Label>Animation Type</Label>
                  <Select
                    value={safeSection.animation.type}
                    onValueChange={(value) => updateAnimation({ type: value as 'fadeIn' | 'slideUp' | 'none' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMATION_TYPE_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>Duration: {safeSection.animation.duration}s</Label>
                  <Slider
                    value={[safeSection.animation.duration]}
                    onValueChange={([value]) => updateAnimation({ duration: value })}
                    max={3}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Delay */}
                <div className="space-y-2">
                  <Label>Delay: {safeSection.animation.delay}s</Label>
                  <Slider
                    value={[safeSection.animation.delay]}
                    onValueChange={([value]) => updateAnimation({ delay: value })}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onClose}>
            Save Section
          </Button>
        </div>

        {/* Media Library Modal */}
        {isMediaLibraryOpen && (
          <MediaLibrary
            isOpen={isMediaLibraryOpen}
            onSelect={handleMediaSelect}
            onClose={() => {
              setIsMediaLibraryOpen(false);
              setCurrentImageIndex(null);
              setIsPinnedImageOpen(false);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

