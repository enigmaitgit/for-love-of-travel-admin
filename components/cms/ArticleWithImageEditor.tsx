'use client';

import * as React from 'react';
import { X, Eye, Image, Type, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      imagePosition: 'right' as const,
      imageSize: (section.layout?.imageSize || 'medium') as 'small' | 'medium' | 'large',
      showPinnedImage: section.layout?.showPinnedImage ?? true,
      showChangingImages: section.layout?.showChangingImages ?? true
    },
    animation: {
      enabled: false,
      type: 'fadeIn' as const,
      duration: 0.5,
      delay: 0
    }
  }), [section]);

  const updateSection = (updates: Partial<ArticleWithImageSection>) => {
    const updated = { ...safeSection, ...updates };
    console.log('ArticleEditor: Updating section:', updated);
    onChange(updated);
  };

  const updateChangingImage = (index: number, updates: Partial<ArticleWithImageSection['changingImages'][0]>) => {
    const newChangingImages = [...safeSection.changingImages];
    newChangingImages[index] = { ...newChangingImages[index], ...updates };
    updateSection({ changingImages: newChangingImages });
  };

  const updatePinnedImage = (updates: Partial<ArticleWithImageSection['pinnedImage']>) => {
    updateSection({ pinnedImage: { ...safeSection.pinnedImage, ...updates } });
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
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{title || 'Article Title'}</h2>
          
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content || '<p>Article content will appear here...</p>' }} />
          </div>
        </div>

        {/* Images Preview */}
        <div className="space-y-4">
          {/* Pinned Image */}
          {layout.showPinnedImage && pinnedImage?.url && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Pinned Image</h4>
              <div className="relative">
                <img
                  src={pinnedImage.url}
                  alt={pinnedImage.altText || 'Pinned image'}
                  className={cn(
                    'rounded-lg object-cover',
                    layout.imageSize === 'small' ? 'h-32' : 
                    layout.imageSize === 'large' ? 'h-64' : 'h-48'
                  )}
                />
                {pinnedImage.caption && (
                  <p className="text-sm text-muted-foreground mt-2">{pinnedImage.caption}</p>
                )}
              </div>
            </div>
          )}

          {/* Changing Images */}
          {layout.showChangingImages && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Changing Images</h4>
              <div className="grid grid-cols-3 gap-2">
                {changingImages.map((image, index) => (
                  <div key={index} className="relative">
                    {image.url ? (
                      <img
                        src={image.url}
                        alt={image.altText || `Changing image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {image.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{image.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Article Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Close Preview
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Images
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
                className="text-lg"
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
          </TabsContent>

          <TabsContent value="images" className="space-y-6 mt-6">
            {/* Pinned Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Pinned Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {safeSection.pinnedImage?.url ? (
                    <div className="relative">
                      <img
                        src={safeSection.pinnedImage.url}
                        alt={safeSection.pinnedImage.altText || 'Pinned image'}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => updatePinnedImage({ url: '', altText: '', caption: '' })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPinnedImageOpen(true);
                      setIsMediaLibraryOpen(true);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Image
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alt Text</Label>
                    <Input
                      value={safeSection.pinnedImage?.altText || ''}
                      onChange={(e) => updatePinnedImage({ altText: e.target.value })}
                      placeholder="Describe the image..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Caption</Label>
                    <Input
                      value={safeSection.pinnedImage?.caption || ''}
                      onChange={(e) => updatePinnedImage({ caption: e.target.value })}
                      placeholder="Image caption..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changing Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Changing Images (3 required)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {safeSection.changingImages.map((image, index) => (
                    <div key={index} className="space-y-2">
                      <Label>Image {index + 1}</Label>
                      <div className="flex items-center gap-2">
                        {image.url ? (
                          <div className="relative">
                            <img
                              src={image.url}
                              alt={image.altText || `Changing image ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-5 w-5 p-0"
                              onClick={() => updateChangingImage(index, { url: '', altText: '', caption: '' })}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setIsMediaLibraryOpen(true);
                          }}
                        >
                          <Upload className="w-3 h-3" />
                        </Button>
                      </div>
                      <Input
                        value={image.altText || ''}
                        onChange={(e) => updateChangingImage(index, { altText: e.target.value })}
                        placeholder="Alt text..."
                        className="text-xs"
                      />
                      <Input
                        value={image.caption || ''}
                        onChange={(e) => updateChangingImage(index, { caption: e.target.value })}
                        placeholder="Caption..."
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
