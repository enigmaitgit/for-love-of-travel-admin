'use client';

import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Eye, Trash2, Edit3, Image, Type, Layout, Users, ChevronRight, Map, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ContentSection, HeroSection, TextSection, ImageSection, GallerySection, PopularPostsSection, BreadcrumbSection, ArticleWithImageSection } from '@/lib/validation';
import { MediaAsset } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-utils';
import { HeroSectionEditor } from './HeroSectionEditor';
import { TextSectionEditor } from './TextSectionEditor';
import { ImageSectionEditor } from './ImageSectionEditor';
import { GallerySectionEditor } from './GallerySectionEditor';
import { PopularPostsSectionEditor } from './PopularPostsSectionEditor';
import { BreadcrumbSectionEditor } from './BreadcrumbSectionEditor';
import { ArticleWithImageEditor } from './ArticleSectionEditor';

// Helper components for safe image rendering
const FeaturedPostImage = ({ imageUrl, title, excerpt }: { imageUrl?: string; title: string; excerpt: string }) => {
  const [imageError, setImageError] = React.useState(false);
  const resolvedImageUrl = React.useMemo(() => {
    return getImageDisplayUrl(imageUrl || '');
  }, [imageUrl]);

  if (!resolvedImageUrl || imageError) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
        <div className="text-center text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-2"  />
          <p>No featured image</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={resolvedImageUrl}
        alt="Featured article"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg">
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/90 text-sm">{excerpt}</p>
        </div>
      </div>
    </>
  );
};

const SidePostItem = ({ post, postIndex }: { post: unknown; postIndex: number }) => {
  const [imageError, setImageError] = React.useState(false);
  const postData = post as { imageUrl?: string; title?: string; excerpt?: string };
  const resolvedImageUrl = React.useMemo(() => {
    return getImageDisplayUrl(postData?.imageUrl || '');
  }, [postData?.imageUrl]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="flex h-24">
        <div className="relative w-24 h-full flex-shrink-0">
          {resolvedImageUrl && !imageError ? (
            <img
              src={resolvedImageUrl}
              alt="Article image"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Image className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 p-3">
          <h4 className="font-semibold text-sm mb-1 line-clamp-2">
            {postData?.title || `Side Post ${postIndex + 1}`}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {postData?.excerpt || 'Post excerpt...'}
          </p>
        </div>
      </div>
    </div>
  );
};

interface ContentBuilderProps {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
  onEditingChange?: (isEditing: boolean) => void;
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
    type: 'article',
    label: 'Article with Images',
    description: 'Article content with pinned and changing images',
    icon: FileText,
    color: 'bg-emerald-500'
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

export function ContentBuilder({ sections, onChange, onEditingChange, className }: ContentBuilderProps) {
  const [editingSection, setEditingSection] = React.useState<number | null>(null);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [showLayoutPreview, setShowLayoutPreview] = React.useState(false);
  const [mediaAssets, setMediaAssets] = React.useState<MediaAsset[]>([]);

  // Load media assets to resolve IDs to URLs
  React.useEffect(() => {
    const loadMediaAssets = async () => {
      try {
        const response = await fetch('/api/admin/media');
        const responseData = await response.json();
        const data = responseData.data || responseData;
        setMediaAssets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading media assets:', error);
      }
    };
    loadMediaAssets();
  }, []);

  // Notify parent when editing state changes
  React.useEffect(() => {
    onEditingChange?.(editingSection !== null);
  }, [editingSection, onEditingChange]);

  // Handle section editor changes with better state management
  const handleSectionChange = (index: number, updatedSection: ContentSection) => {
    console.log('ContentBuilder: Section changed at index', index, ':', updatedSection);
    const cleanedSection = cleanSectionData(updatedSection);
    console.log('ContentBuilder: Cleaned section after change:', cleanedSection);
    const newSections = [...sections];
    newSections[index] = cleanedSection;
    onChange(newSections);
  };

  // Helper function to resolve asset ID to URL
  const resolveImageUrl = (imageUrl: string | undefined): string => {
    // Return empty string if imageUrl is undefined, null, or empty
    if (!imageUrl || imageUrl === 'undefined' || imageUrl.trim() === '') {
      return '';
    }
    
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

    console.log('ContentBuilder: Sections reordered:', newSections);
    onChange(newSections);
  };

  const addSection = (type: string) => {
    console.log('ContentBuilder: Adding new section of type:', type);
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
      case 'article':
        newSection = {
          type: 'article',
          title: '',
          content: '',
          changingImages: [
            { url: '', altText: '', caption: '', order: 0 },
            { url: '', altText: '', caption: '', order: 1 },
            { url: '', altText: '', caption: '', order: 2 }
          ],
          pinnedImage: { url: '', altText: '', caption: '' },
          layout: {
            imageSize: 'medium',
            showPinnedImage: true,
            showChangingImages: true
          },
          animation: {
            enabled: false,
            type: 'fadeIn',
            duration: 0.5,
            delay: 0
          }
        } as ArticleWithImageSection;
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
          featuredPost: {
            title: '',
            excerpt: '',
            imageUrl: '',
            readTime: '',
            publishDate: '',
            category: ''
          },
          sidePosts: []
        } as PopularPostsSection;
        break;
      default:
        return;
    }

    console.log('ContentBuilder: New section created:', newSection);
    const cleanedSection = cleanSectionData(newSection);
    console.log('ContentBuilder: Cleaned section:', cleanedSection);
    onChange([...sections, cleanedSection]);
  };

  // Helper function to clean undefined values from section data
  const cleanSectionData = (section: ContentSection): ContentSection => {
    // Only clean the specific "undefined" string issue, don't over-clean
    const cleanObject = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        return obj === 'undefined' ? '' : obj; // Convert 'undefined' string to empty string
      }
      if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      }
      if (typeof obj === 'object') {
        const cleanedObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          cleanedObj[key] = cleanObject(value);
        }
        return cleanedObj;
      }
      return obj;
    };
    
    return cleanObject(section) as ContentSection;
  };

  const updateSection = (index: number, updatedSection: ContentSection) => {
    console.log('ContentBuilder: Updating section at index', index, ':', updatedSection);
    const cleanedSection = cleanSectionData(updatedSection);
    console.log('ContentBuilder: Cleaned section after update:', cleanedSection);
    const newSections = [...sections];
    newSections[index] = cleanedSection;
    onChange(newSections);
  };

  const removeSection = (index: number) => {
    console.log('ContentBuilder: Removing section at index', index);
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
      case 'article':
        return (
          <ArticleWithImageEditor
            section={section as ArticleWithImageSection}
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
        console.log('ContentBuilder: Passing section to PopularPostsSectionEditor:', section);
        return (
          <PopularPostsSectionEditor
            section={section as PopularPostsSection}
            onChange={(updated) => handleSectionChange(index, updated)}
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
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(index)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
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
              <p>Content: {(section as TextSection).content?.substring(0, 100)}...</p>
            )}
            {section.type === 'article' && (section as ArticleWithImageSection).title && (
              <p>Title: {(section as ArticleWithImageSection).title}</p>
            )}
            {section.type === 'image' && (section as ImageSection).imageUrl && (
              <p>Image: {(section as ImageSection).imageUrl}</p>
            )}
            {section.type === 'gallery' && (() => {
              const gallerySection = section as GallerySection;
              return gallerySection.images && gallerySection.images.length > 0;
            })() && (
              <p>Images: {(section as GallerySection).images?.length} items</p>
            )}
            {section.type === 'popular-posts' && (section as PopularPostsSection).title && (
              <p>Title: {(section as PopularPostsSection).title}</p>
            )}
            {section.type === 'breadcrumb' && (() => {
              const breadcrumbSection = section as BreadcrumbSection;
              return breadcrumbSection.items && breadcrumbSection.items.length > 0;
            })() && (
              <p>Items: {(section as BreadcrumbSection).items?.map(item => item.label).join(' > ')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderActualPreview = (section: ContentSection, index: number) => {
    try {
      switch (section?.type) {
        case 'hero':
          return renderHeroPreview(section as HeroSection, index);
        case 'text':
          return renderTextPreview(section as TextSection, index);
        case 'article':
          return renderArticlePreview(section as ArticleWithImageSection, index);
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
    } catch (error) {
      console.error('Error rendering section preview:', error, section);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering {section?.type || 'unknown'} section</p>
        </div>
      );
    }
  };

  const renderHeroPreview = (section: HeroSection, _index: number) => {
    try {
      const resolvedImageUrl = getImageDisplayUrl(section?.backgroundImage || '');
      
      return (
      <div className="relative w-full h-[300px] overflow-hidden shadow-lg group cursor-pointer rounded-lg">
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
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
              <Image className="w-12 h-12 mx-auto mb-2"  />
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
    } catch (error) {
      console.error('Error rendering Hero Preview:', error);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering Hero section</p>
        </div>
      );
    }
  };

  const renderTextPreview = (section: TextSection, _index: number) => {
    try {
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
        alignmentClasses[section.alignment || 'left'],
        fontSizeClasses[section.fontSize || 'base'],
        fontFamilyClasses[section.fontFamily || 'inter'],
        lineHeightClasses[section.lineHeight || 'normal']
      )}>
        {section.dropCap?.enabled && section.content ? (
          <div className={cn("leading-relaxed", lineHeightClasses[section.lineHeight || 'normal'])}>
            <span className={cn(
              "float-left mr-2 leading-none",
              section.dropCap?.size,
              section.dropCap?.color
            )}>
              {section.content.charAt(0)}
            </span>
            <div dangerouslySetInnerHTML={{ __html: section.content.slice(1) }} />
          </div>
        ) : (
          <div 
            className={cn("leading-relaxed", lineHeightClasses[section.lineHeight || 'normal'])}
            dangerouslySetInnerHTML={{ __html: section.content || '<p>Text content will appear here...</p>' }}
          />
        )}
      </div>
      );
    } catch (error) {
      console.error('Error rendering Text Preview:', error);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering Text section</p>
        </div>
      );
    }
  };

  const renderArticlePreview = (section: ArticleWithImageSection, _index: number) => {
    try {
      const { title, content, changingImages, pinnedImage, layout } = section;
      
      return (
        <div className="space-y-6 p-4 border rounded-lg">
          {/* Article Content - Full Width */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{title || 'Article Title'}</h2>
            
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content || '<p>Article content will appear here...</p>' }} />
            </div>
          </div>

          {/* Images Section - Below Content */}
          <div className="space-y-4">
            {/* Pinned Image */}
            {layout?.showPinnedImage && pinnedImage?.url && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Pinned Image</h4>
                <div className="relative">
                  <img
                    src={resolveImageUrl(pinnedImage.url)}
                    alt={pinnedImage.altText || 'Pinned image'}
                    className={cn(
                      'w-full rounded-lg object-cover',
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
            {layout?.showChangingImages && changingImages && changingImages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Changing Images</h4>
                <div className="grid grid-cols-3 gap-2">
                  {changingImages.map((image, imgIndex) => (
                    <div key={imgIndex} className="relative">
                      {image.url ? (
                        <img
                          src={resolveImageUrl(image.url)}
                          alt={image.altText || `Changing image ${imgIndex + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground"  />
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
    } catch (error) {
      console.error('Error rendering Article Preview:', error);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering Article section</p>
        </div>
      );
    }
  };

  const renderImagePreview = (section: ImageSection, _index: number) => {
    try {
      const alignmentClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
      };

      const resolvedImageUrl = resolveImageUrl(section?.imageUrl);

    return (
      <div className={cn('space-y-2 p-4 border rounded-lg', alignmentClasses[section.alignment || 'center'])}>
        {resolvedImageUrl ? (
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
              <Image className="w-12 h-12 mx-auto mb-2"  />
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
    } catch (error) {
      console.error('Error rendering Image Preview:', error);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering Image section</p>
        </div>
      );
    }
  };

  const renderGalleryPreview = (section: GallerySection, _index: number) => {
    try {
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

    if (!section.images || section.images.length === 0) {
      return (
        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center p-4 border">
          <div className="text-center text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-2"  />
            <p>No images in gallery</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(
        'grid p-4 border rounded-lg',
        gridClasses[section.columns as keyof typeof gridClasses],
        spacingClasses[section.spacing as keyof typeof spacingClasses]
      )}>
        {section.images.slice(0, 6).map((image, imgIndex) => {
          const resolvedImageUrl = resolveImageUrl(image.url);
          return (
            <div key={imgIndex} className="relative group">
              {resolvedImageUrl ? (
                <img
                  src={resolvedImageUrl}
                  alt={image.altText || `Gallery image ${imgIndex + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground"  />
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
        {section.images.length > 6 && (
          <div className="flex items-center justify-center bg-muted rounded-lg">
            <span className="text-muted-foreground text-sm">
              +{section.images.length - 6} more
            </span>
          </div>
        )}
      </div>
      );
    } catch (error) {
      console.error('Error rendering Gallery Preview:', error);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering Gallery section</p>
        </div>
      );
    }
  };

  const renderPopularPostsPreview = (section: PopularPostsSection, _index: number) => {
    try {
      console.log('Rendering Popular Posts Preview:', section);
      
      return (
        <div className="p-4 border rounded-lg">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {section?.title || 'Popular Posts'}
            </h2>
            {section?.description && (
              <p className="text-gray-600">{section.description}</p>
            )}
          </div>
          
          {section?.featuredPost && (
            <div className="relative w-full h-[200px] overflow-hidden shadow-lg group cursor-pointer rounded-lg mb-6">
              <FeaturedPostImage 
                imageUrl={section.featuredPost?.imageUrl}
                title={section.featuredPost?.title || 'Featured Post Title'}
                excerpt={section.featuredPost?.excerpt || 'Featured post excerpt...'}
              />
            </div>
          )}

          {section?.sidePosts && section.sidePosts.length > 0 && (
            <div className="space-y-4">
              {section.sidePosts.slice(0, 3).map((post, postIndex) => (
                <SidePostItem 
                  key={postIndex}
                  post={post}
                  postIndex={postIndex}
                />
              ))}
            </div>
          )}

          {/* Debug info removed for cleaner preview */}
        </div>
      );
    } catch (error) {
      console.error('Error rendering Popular Posts Preview:', error);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering Popular Posts section</p>
        </div>
      );
    }
  };

  const renderBreadcrumbPreview = (section: BreadcrumbSection, _index: number) => {
    try {
      if (!section?.enabled || !section?.items || section.items.length === 0) {
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
                  {section.style?.separator || '>'}
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
    } catch (error) {
      console.error('Error rendering Breadcrumb Preview:', error);
      return (
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-red-600">Error rendering Breadcrumb section</p>
        </div>
      );
    }
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
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLayoutPreview(true)}
          >
            <Map className="w-4 h-4 mr-2" />
            Layout Guide
          </Button>
          <Button
            type="button"
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
