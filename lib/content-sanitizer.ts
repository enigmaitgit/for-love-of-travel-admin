// Content sanitization utilities to remove data URLs and optimize payloads
import { ContentSection } from './validation';
import { resolveImage } from './image-utils';

/**
 * Recursively sanitizes content sections to remove data URLs and optimize payloads
 */
export function sanitizeContentSections(sections: ContentSection[]): ContentSection[] {
  return sections.map(section => sanitizeContentSection(section));
}

/**
 * Sanitizes a single content section
 */
function sanitizeContentSection(section: ContentSection): ContentSection {
  switch (section.type) {
    case 'hero':
      return {
        ...section,
        backgroundImage: section.backgroundImage ? resolveImage(section.backgroundImage) : ''
      };
    
    case 'image':
      return {
        ...section,
        imageUrl: section.imageUrl ? resolveImage(section.imageUrl) : ''
      };
    
    case 'gallery':
      const galleryResult = {
        ...section,
        images: section.images?.map(image => {
          const originalUrl = image.url;
          const sanitizedUrl = image.url ? resolveImage(image.url) : '';
          console.log('ContentSanitizer - Gallery image sanitization:', {
            original: originalUrl,
            sanitized: sanitizedUrl,
            urlType: originalUrl ? (originalUrl.startsWith('data:') ? 'data' : originalUrl.startsWith('http') ? 'http' : 'other') : 'empty'
          });
          return {
            ...image,
            url: sanitizedUrl
          };
        }) || []
      };
      console.log('ContentSanitizer - Gallery section result:', galleryResult);
      return galleryResult;
    
    case 'popular-posts':
      return {
        ...section,
        featuredPost: section.featuredPost ? {
          ...section.featuredPost,
          imageUrl: section.featuredPost.imageUrl ? resolveImage(section.featuredPost.imageUrl) : ''
        } : undefined,
        sidePosts: section.sidePosts?.map(post => ({
          ...post,
          imageUrl: post.imageUrl ? resolveImage(post.imageUrl) : ''
        })) || []
      };
    
    case 'text':
    case 'breadcrumb':
    default:
      // These sections don't contain images, return as-is
      return section;
  }
}

/**
 * Sanitizes a post's featured image
 */
export function sanitizeFeaturedImage(featuredImage: string | { url: string; alt?: string; caption?: string } | undefined): string | { url: string; alt?: string; caption?: string } | undefined {
  if (!featuredImage) return featuredImage;
  
  if (typeof featuredImage === 'string') {
    return resolveImage(featuredImage);
  }
  
  if (typeof featuredImage === 'object' && featuredImage.url) {
    return {
      ...featuredImage,
      url: resolveImage(featuredImage.url)
    };
  }
  
  return featuredImage;
}

/**
 * Sanitizes an entire post object to remove data URLs
 */
export function sanitizePostData(postData: Record<string, unknown>): Record<string, unknown> {
  return {
    ...postData,
    featuredImage: sanitizeFeaturedImage(postData.featuredImage as string | { url: string; alt?: string; caption?: string } | undefined),
    contentSections: postData.contentSections ? sanitizeContentSections(postData.contentSections as ContentSection[]) : []
  };
}

/**
 * Checks if a content section contains data URLs
 */
export function containsDataUrls(sections: ContentSection[]): boolean {
  return sections.some(section => {
    switch (section.type) {
      case 'hero':
        return section.backgroundImage?.startsWith('data:') || false;
      case 'image':
        return section.imageUrl?.startsWith('data:') || false;
      case 'gallery':
        return section.images?.some(img => img.url?.startsWith('data:')) || false;
      case 'popular-posts':
        return (
          section.featuredPost?.imageUrl?.startsWith('data:') ||
          section.sidePosts?.some(post => post.imageUrl?.startsWith('data:'))
        ) || false;
      default:
        return false;
    }
  });
}

/**
 * Gets the size of a content section in bytes (approximate)
 */
export function getContentSectionSize(sections: ContentSection[]): number {
  return JSON.stringify(sections).length;
}

/**
 * Logs content section statistics for debugging
 */
export function logContentSectionStats(sections: ContentSection[]): void {
  const size = getContentSectionSize(sections);
  const hasDataUrls = containsDataUrls(sections);
  
  console.log('Content Section Stats:', {
    sectionCount: sections.length,
    totalSize: `${(size / 1024).toFixed(2)} KB`,
    hasDataUrls,
    sections: sections.map(s => ({
      type: s.type,
      size: `${(JSON.stringify(s).length / 1024).toFixed(2)} KB`
    }))
  });
}
