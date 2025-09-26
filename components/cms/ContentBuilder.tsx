'use client';

import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Eye, Trash2, Edit3, Image, Type, Layout, Users, ChevronRight, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ContentSection, HeroSection, TextSection, ImageSection, GallerySection, PopularPostsSection, BreadcrumbSection } from '@/lib/validation';
import { MediaAsset } from '@/lib/api';
import { HeroSectionEditor } from './HeroSectionEditor';
import { TextSectionEditor } from './TextSectionEditor';
import { ImageSectionEditor } from './ImageSectionEditor';
import { GallerySectionEditor } from './GallerySectionEditor';
import { PopularPostsSectionEditor } from './PopularPostsSectionEditor';
import { BreadcrumbSectionEditor } from './BreadcrumbSectionEditor';

interface ContentBuilderProps {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
  className?: string;
}

const SECTION_TYPES = [
  {
    type: 'hero',
    label: 'Hero Section',
    description: 'Full-screen hero with background image and overlay',
    icon: Image,
    color: 'bg-blue-500'
  },
  {
    type: 'breadcrumb',
    label: 'Breadcrumb',
    description: 'Navigation breadcrumb trail',
    icon: ChevronRight,
    color: 'bg-gray-500'
  },
  {
    type: 'text',
    label: 'Text Block',
    description: 'Rich text content with formatting options',
    icon: Type,
    color: 'bg-green-500'
  },
  {
    type: 'image',
    label: 'Single Image',
    description: 'Single image with caption and styling',
    icon: Image,
    color: 'bg-purple-500'
  },
  {
    type: 'gallery',
    label: 'Image Gallery',
    description: 'Multiple images in grid or masonry layout',
    icon: Layout,
    color: 'bg-orange-500'
  },
  {
    type: 'popular-posts',
    label: 'Popular Posts',
    description: 'Featured and side posts section',
    icon: Users,
    color: 'bg-pink-500'
  }
] as const;

export function ContentBuilder({ sections, onChange, className }: ContentBuilderProps) {
  const [editingSection, setEditingSection] = React.useState<number | null>(null);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [showLayoutPreview, setShowLayoutPreview] = React.useState(false);
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newSections = Array.from(sections);
    const [reorderedItem] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, reorderedItem);

    onChange(newSections);
  };

  const addSection = (type: string) => {
    let newSection: ContentSection;

    switch (type) {
      case 'hero':
        newSection = {
          type: 'hero',
          backgroundImage: '',
          title: '',
          subtitle: '',
          author: '',
          publishDate: '',
          readTime: '',
          overlayOpacity: 0.3,
          height: { mobile: '70vh', tablet: '80vh', desktop: '90vh' },
          titleSize: { mobile: 'text-3xl', tablet: 'text-5xl', desktop: 'text-6xl' },
          parallaxEnabled: true,
          parallaxSpeed: 0.5,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          animation: { enabled: true, type: 'fadeIn', duration: 0.8, delay: 0 },
          socialSharing: {
            enabled: true,
            platforms: ['facebook', 'twitter', 'linkedin', 'copy'],
            position: 'bottom-right',
            style: 'glass'
          }
        } as HeroSection;
        break;
      case 'breadcrumb':
        newSection = {
          type: 'breadcrumb',
          enabled: true,
          items: [
            { label: 'Home', href: '/' },
            { label: 'Destinations', href: '#destinations' }
          ],
          style: {
            separator: '>',
            textSize: 'sm',
            showHomeIcon: false,
            color: 'gray'
          }
        } as BreadcrumbSection;
        break;
      case 'text':
        newSection = {
          type: 'text',
          content: '',
          hasDropCap: false,
          alignment: 'left',
          fontSize: 'base',
          fontFamily: 'inter',
          lineHeight: 'relaxed',
          dropCap: {
            enabled: false,
            size: 'text-4xl',
            color: 'text-gray-900',
            fontWeight: 'semibold',
            float: true
          },
          animation: {
            enabled: true,
            type: 'fadeIn',
            duration: 0.3,
            delay: 0.1
          }
        } as TextSection;
        break;
      case 'image':
        newSection = {
          type: 'image',
          imageUrl: '',
          altText: '',
          caption: '',
          alignment: 'center',
          rounded: true,
          shadow: true
        } as ImageSection;
        break;
      case 'gallery':
        newSection = {
          type: 'gallery',
          images: [],
          layout: 'grid',
          columns: 3,
          spacing: 'md',
          responsive: {
            mobile: { layout: 'grid', columns: 2 },
            desktop: { layout: 'grid', columns: 3 }
          },
          hoverEffects: {
            enabled: true,
            scale: 1.03,
            shadow: true,
            overlay: true
          },
          animation: {
            enabled: true,
            type: 'fadeIn',
            duration: 0.5,
            stagger: 0.1
          }
        } as GallerySection;
        break;
      case 'popular-posts':
        newSection = {
          type: 'popular-posts',
          title: 'Popular Posts',
          description: '',
          featuredPost: undefined,
          sidePosts: []
        } as PopularPostsSection;
        break;
      default:
        return;
    }

    onChange([...sections, newSection]);
  };

  const updateSection = (index: number, updatedSection: ContentSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    onChange(newSections);
  };

  const removeSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    onChange(newSections);
  };

  const renderSectionEditor = (section: ContentSection, index: number) => {
    switch (section.type) {
      case 'hero':
        return (
          <HeroSectionEditor
            section={section as HeroSection}
            onChange={(updated) => updateSection(index, updated)}
            onClose={() => setEditingSection(null)}
          />
        );
      case 'text':
        return (
          <TextSectionEditor
            section={section as TextSection}
            onChange={(updated) => updateSection(index, updated)}
            onClose={() => setEditingSection(null)}
          />
        );
      case 'image':
        return (
          <ImageSectionEditor
            section={section as ImageSection}
            onChange={(updated) => updateSection(index, updated)}
            onClose={() => setEditingSection(null)}
          />
        );
      case 'gallery':
        return (
          <GallerySectionEditor
            section={section as GallerySection}
            onChange={(updated) => updateSection(index, updated)}
            onClose={() => setEditingSection(null)}
          />
        );
      case 'popular-posts':
        return (
          <PopularPostsSectionEditor
            section={section as PopularPostsSection}
            onChange={(updated) => updateSection(index, updated)}
            onClose={() => setEditingSection(null)}
          />
        );
      case 'breadcrumb':
        return (
          <BreadcrumbSectionEditor
            section={section as BreadcrumbSection}
            onChange={(updated) => updateSection(index, updated)}
            onClose={() => setEditingSection(null)}
          />
        );
      default:
        return null;
    }
  };

  const renderSectionPreview = (section: ContentSection, index: number) => {
    const sectionType = SECTION_TYPES.find(t => t.type === section.type);
    const Icon = sectionType?.icon || Type;

    return (
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', sectionType?.color)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-medium leading-tight">
                  {sectionType?.label}
                </CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed break-words">
                  {sectionType?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(index)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSection(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            {section.type === 'hero' && (section as HeroSection).title && (
              <p>Title: {(section as HeroSection).title}</p>
            )}
            {section.type === 'text' && (section as TextSection).content && (
              <p>Content: {(section as TextSection).content.substring(0, 100)}...</p>
            )}
            {section.type === 'image' && (section as ImageSection).imageUrl && (
              <p>Image: {(section as ImageSection).imageUrl}</p>
            )}
            {section.type === 'gallery' && (section as GallerySection).images.length > 0 && (
              <p>Images: {(section as GallerySection).images.length} items</p>
            )}
            {section.type === 'popular-posts' && (section as PopularPostsSection).title && (
              <p>Title: {(section as PopularPostsSection).title}</p>
            )}
            {section.type === 'breadcrumb' && (section as BreadcrumbSection).items.length > 0 && (
              <p>Items: {(section as BreadcrumbSection).items.map(item => item.label).join(' > ')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderActualPreview = (section: ContentSection, index: number) => {
    switch (section.type) {
      case 'hero':
        return renderHeroPreview(section as HeroSection, index);
      case 'text':
        return renderTextPreview(section as TextSection, index);
      case 'image':
        return renderImagePreview(section as ImageSection, index);
      case 'gallery':
        return renderGalleryPreview(section as GallerySection, index);
      case 'popular-posts':
        return renderPopularPostsPreview(section as PopularPostsSection, index);
      case 'breadcrumb':
        return renderBreadcrumbPreview(section as BreadcrumbSection, index);
      default:
        return renderSectionPreview(section, index);
    }
  };

  const renderHeroPreview = (section: HeroSection, index: number) => {
    return (
      <div className="relative w-full h-[300px] overflow-hidden shadow-lg group cursor-pointer rounded-lg">
        {section.backgroundImage ? (
          <img
            src={resolveImageUrl(section.backgroundImage)}
            alt="Hero background"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
            style={{
              objectPosition: section.backgroundPosition,
              objectFit: section.backgroundSize
            }}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
            <div className="text-center text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-2" />
              <p>No background image</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg">
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white mb-2">
              {section.title || 'Hero Title'}
            </h1>
            {section.subtitle && (
              <p className="text-white/90 mb-2">{section.subtitle}</p>
            )}
            <div className="flex items-center gap-4 text-white/80 text-sm">
              {section.author && <span>By {section.author}</span>}
              {section.publishDate && <span>{section.publishDate}</span>}
              {section.readTime && <span>{section.readTime}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTextPreview = (section: TextSection, index: number) => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    };

    const fontSizeClasses = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };

    const fontFamilyClasses = {
      inter: 'font-sans',
      serif: 'font-serif',
      sans: 'font-sans',
      mono: 'font-mono'
    };

    const lineHeightClasses = {
      tight: 'leading-tight',
      snug: 'leading-snug',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
      loose: 'leading-loose'
    };

    return (
      <div className={cn(
        'prose max-w-none p-4 border rounded-lg',
        alignmentClasses[section.alignment],
        fontSizeClasses[section.fontSize],
        fontFamilyClasses[section.fontFamily],
        lineHeightClasses[section.lineHeight]
      )}>
        {section.dropCap?.enabled && section.content ? (
          <p className={cn("leading-relaxed", lineHeightClasses[section.lineHeight])}>
            <span className={cn(
              "float-left mr-2 leading-none",
              section.dropCap?.size,
              section.dropCap?.color
            )}>
              {section.content.charAt(0)}
            </span>
            {section.content.slice(1)}
          </p>
        ) : (
          <p className={cn("leading-relaxed", lineHeightClasses[section.lineHeight])}>
            {section.content || 'Text content will appear here...'}
          </p>
        )}
      </div>
    );
  };

  const renderImagePreview = (section: ImageSection, index: number) => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };

    return (
      <div className={cn('space-y-2 p-4 border rounded-lg', alignmentClasses[section.alignment])}>
        {section.imageUrl ? (
          <img
            src={resolveImageUrl(section.imageUrl)}
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

  const renderGalleryPreview = (section: GallerySection, index: number) => {
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

    if (section.images.length === 0) {
      return (
        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center p-4 border">
          <div className="text-center text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-2" />
            <p>No images in gallery</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(
        'grid p-4 border rounded-lg',
        gridClasses[section.columns],
        spacingClasses[section.spacing]
      )}>
        {section.images.slice(0, 6).map((image, imgIndex) => (
          <div key={imgIndex} className="relative group">
            <img
              src={resolveImageUrl(image.url)}
              alt={image.altText || `Gallery image ${imgIndex + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 rounded-b-lg">
                {image.caption}
              </div>
            )}
          </div>
        ))}
        {section.images.length > 6 && (
          <div className="flex items-center justify-center bg-muted rounded-lg">
            <span className="text-muted-foreground text-sm">
              +{section.images.length - 6} more
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderPopularPostsPreview = (section: PopularPostsSection, index: number) => {
    return (
      <div className="p-4 border rounded-lg">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {section.title || 'Popular Posts'}
          </h2>
          {section.description && (
            <p className="text-gray-600">{section.description}</p>
          )}
        </div>
        
        {section.featuredPost && (
          <div className="relative w-full h-[200px] overflow-hidden shadow-lg group cursor-pointer rounded-lg mb-6">
            {section.featuredPost.imageUrl ? (
              <img
                src={resolveImageUrl(section.featuredPost.imageUrl)}
                alt="Featured article"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p>No featured image</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  {section.featuredPost.title || 'Featured Post Title'}
                </h3>
                <p className="text-white/90 text-sm">
                  {section.featuredPost.excerpt || 'Featured post excerpt...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {section.sidePosts.length > 0 && (
          <div className="space-y-4">
            {section.sidePosts.slice(0, 3).map((post, postIndex) => (
              <div key={postIndex} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="flex h-24">
                  <div className="relative w-24 h-full flex-shrink-0">
                    {post.imageUrl ? (
                      <img
                        src={resolveImageUrl(post.imageUrl)}
                        alt="Article image"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                      {post.title || `Side Post ${postIndex + 1}`}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {post.excerpt || 'Post excerpt...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBreadcrumbPreview = (section: BreadcrumbSection, index: number) => {
    if (!section.enabled || section.items.length === 0) {
      return (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Breadcrumb disabled or no items</p>
        </div>
      );
    }

    return (
      <nav className="p-4 border rounded-lg">
        <ol className="flex items-center space-x-2 text-sm">
          {section.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-center">
              {itemIndex > 0 && (
                <span className="mx-2 text-muted-foreground">
                  {section.style.separator}
                </span>
              )}
              <a
                href={item.href}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  if (editingSection !== null) {
    return (
      <div className={cn('space-y-4', className)}>
        {renderSectionEditor(sections[editingSection], editingSection)}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Sections</h3>
          <p className="text-sm text-muted-foreground">
            Build your content with drag-and-drop sections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLayoutPreview(true)}
          >
            <Map className="w-4 h-4 mr-2" />
            Layout Guide
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Add Section Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {SECTION_TYPES.map((sectionType) => {
          const Icon = sectionType.icon;
          return (
            <div
              key={sectionType.type}
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted min-h-[120px] border border-input bg-background rounded-md cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => addSection(sectionType.type)}
            >
              <div className={cn('p-2 rounded-lg', sectionType.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="w-full space-y-1">
                <div className="text-sm font-medium leading-tight text-center">{sectionType.label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-normal break-words text-center">
                  {sectionType.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sections List */}
      {sections.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {sections.map((section, index) => (
                  <Draggable
                    key={`${section.type}-${index}`}
                    draggableId={`${section.type}-${index}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          'transition-all',
                          snapshot.isDragging && 'shadow-lg scale-105'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-6 p-1 hover:bg-muted rounded cursor-grab"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            {previewMode ? (
                              <div className="border rounded-lg bg-white shadow-sm">
                                <div className="p-2 bg-muted/30 border-b">
                                  <Badge variant="secondary" className="text-xs">
                                    {SECTION_TYPES.find(t => t.type === section.type)?.label}
                                  </Badge>
                                </div>
                                <div className="p-2">
                                  {renderActualPreview(section, index)}
                                </div>
                              </div>
                            ) : (
                              renderSectionPreview(section, index)
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sections added yet. Click a section type above to get started.</p>
        </div>
      )}

      {/* Layout Preview Modal */}
      <Dialog open={showLayoutPreview} onOpenChange={setShowLayoutPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Content Page Layout Guide
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              This guide shows you how the content page is structured. Use this as a reference when building your content sections.
            </div>

            {/* Layout Overview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Page Structure</h3>
              
              {/* Navbar */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="font-medium">Navigation Bar</span>
                </div>
                <p className="text-sm text-muted-foreground">Fixed navigation at the top of the page</p>
              </div>

              {/* Hero Section */}
              <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="font-medium">Hero Section</span>
                  <Badge variant="secondary" className="text-xs">Full-width</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Large background image with title, subtitle, author info, and social sharing buttons</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/50 p-2 rounded">Background Image</div>
                  <div className="bg-white/50 p-2 rounded">Title & Subtitle</div>
                  <div className="bg-white/50 p-2 rounded">Author & Date</div>
                  <div className="bg-white/50 p-2 rounded">Social Icons</div>
                </div>
              </div>

              {/* Breadcrumb */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span className="font-medium">Breadcrumb Navigation</span>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Navigation trail showing page hierarchy</p>
              </div>

              {/* Article Content */}
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="font-medium">Article Content</span>
                  <Badge variant="secondary" className="text-xs">Main Content</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Main article content with text blocks, images, and galleries</p>
                <div className="space-y-2">
                  <div className="bg-white/50 p-2 rounded text-xs">Text Blocks with Drop Caps</div>
                  <div className="bg-white/50 p-2 rounded text-xs">Single Images with Captions</div>
                  <div className="bg-white/50 p-2 rounded text-xs">Image Galleries</div>
                  <div className="bg-white/50 p-2 rounded text-xs">Floating Images with Text</div>
                </div>
              </div>

              {/* Popular Posts */}
              <div className="border rounded-lg p-4 bg-orange-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="font-medium">Popular Posts Section</span>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Featured post with side posts in a grid layout</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/50 p-2 rounded col-span-2">Featured Post (Large)</div>
                  <div className="bg-white/50 p-2 rounded">Side Posts</div>
                </div>
              </div>

              {/* Gallery */}
              <div className="border rounded-lg p-4 bg-indigo-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                  <span className="font-medium">Image Gallery</span>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Complex masonry-style gallery with overlapping images</p>
                <div className="text-xs bg-white/50 p-2 rounded">Masonry Grid Layout</div>
              </div>

              {/* Comments */}
              <div className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="font-medium">Comments Section</span>
                  <Badge variant="secondary" className="text-xs">Auto-added</Badge>
                </div>
                <p className="text-sm text-muted-foreground">User comments and interactions</p>
              </div>

              {/* Newsletter */}
              <div className="border rounded-lg p-4 bg-teal-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-teal-500 rounded"></div>
                  <span className="font-medium">Newsletter Signup</span>
                  <Badge variant="secondary" className="text-xs">Auto-added</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Email subscription form</p>
              </div>

              {/* Footer */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-slate-500 rounded"></div>
                  <span className="font-medium">Footer</span>
                  <Badge variant="secondary" className="text-xs">Auto-added</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Site footer with links and information</p>
              </div>
            </div>

            {/* Section Types Guide */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Section Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SECTION_TYPES.map((sectionType) => {
                  const Icon = sectionType.icon;
                  return (
                    <div key={sectionType.type} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('p-2 rounded-lg', sectionType.color)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">{sectionType.label}</h4>
                          <p className="text-sm text-muted-foreground">{sectionType.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tips for Building Content</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Start with a Hero section to create impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Use Text blocks for main content with proper typography</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Add Single Images to break up text and add visual interest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Use Galleries for multiple related images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Add Popular Posts to showcase related content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Use Breadcrumbs for better navigation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
