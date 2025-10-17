import { z } from 'zod';

// Content section schemas
export const HeroSectionSchema = z.object({
  type: z.literal('hero'),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  publishDate: z.string().optional(),
  readTime: z.string().optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  // Enhanced styling options
  height: z.object({
    mobile: z.string(),
    tablet: z.string(),
    desktop: z.string()
  }).optional(),
  titleSize: z.object({
    mobile: z.string(),
    tablet: z.string(),
    desktop: z.string()
  }).optional(),
  // Parallax and motion effects
  parallaxEnabled: z.boolean().optional(),
  parallaxSpeed: z.number().min(0).max(2).optional(),
  // Background positioning
  backgroundPosition: z.enum(['center', 'top', 'bottom', 'left', 'right']).optional(),
  backgroundSize: z.enum(['cover', 'contain']).optional(),
  // Animation settings
  animation: z.object({
    enabled: z.boolean(),
    type: z.enum(['fadeIn', 'slideUp', 'scaleIn', 'none']),
    duration: z.number().min(0.1).max(3),
    delay: z.number().min(0).max(2)
  }).optional(),
  socialSharing: z.object({
    enabled: z.boolean(),
    platforms: z.array(z.enum(['facebook', 'twitter', 'linkedin', 'copy', 'share'])),
    position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
    style: z.enum(['glass', 'solid', 'outline'])
  }).optional()
}).refine((data) => {
  // Ensure at least one background media is provided
  return data.backgroundImage || data.backgroundVideo;
}, {
  message: "Hero section must have either backgroundImage or backgroundVideo",
  path: ["backgroundImage"] // This will show the error on the backgroundImage field
});

export const TextSectionSchema = z.object({
  type: z.literal('text'),
  content: z.string().optional(),
  hasDropCap: z.boolean().optional(),
  alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  fontSize: z.enum(['sm', 'base', 'lg', 'xl']).optional(),
  // Enhanced typography options
  fontFamily: z.enum(['inter', 'serif', 'sans', 'mono']).optional(),
  lineHeight: z.enum(['tight', 'snug', 'normal', 'relaxed', 'loose']).optional(),
  // Drop cap styling
  dropCap: z.object({
    enabled: z.boolean(),
    size: z.enum(['text-4xl', 'text-5xl', 'text-6xl']),
    color: z.string(),
    fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']),
    float: z.boolean()
  }).optional(),
  // Animation settings
  animation: z.object({
    enabled: z.boolean(),
    type: z.enum(['fadeIn', 'slideUp', 'slideInLeft', 'slideInRight', 'none']),
    duration: z.number().min(0.1).max(3),
    delay: z.number().min(0).max(2)
  }).optional()
});

export const ImageSectionSchema = z.object({
  type: z.literal('image'),
  imageUrl: z.string().optional(),
  altText: z.string().optional(),
  caption: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  rounded: z.boolean().optional(),
  shadow: z.boolean().optional()
});

export const GallerySectionSchema = z.object({
  type: z.literal('gallery'),
  images: z.array(z.object({
    url: z.string().optional(),
    altText: z.string().optional(),
    caption: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  })).optional(),
  layout: z.enum(['grid', 'masonry', 'carousel', 'postcard', 'complex']).optional(),
  columns: z.number().min(1).max(6).optional(),
  spacing: z.enum(['sm', 'md', 'lg']).optional(),
  // Enhanced layout options
  responsive: z.object({
    mobile: z.object({
      layout: z.enum(['grid', 'carousel']),
      columns: z.number().min(1).max(2)
    }),
    desktop: z.object({
      layout: z.enum(['grid', 'masonry', 'postcard', 'complex']),
      columns: z.number().min(1).max(6)
    })
  }).optional(),
  // Hover effects and animations
  hoverEffects: z.object({
    enabled: z.boolean(),
    scale: z.number().min(1).max(1.2),
    shadow: z.boolean(),
    overlay: z.boolean()
  }).optional(),
  // Animation settings
  animation: z.object({
    enabled: z.boolean(),
    type: z.enum(['fadeIn', 'slideUp', 'stagger', 'none']),
    duration: z.number().min(0.1).max(3),
    stagger: z.number().min(0).max(1)
  }).optional()
});

export const PopularPostsSectionSchema = z.object({
  type: z.literal('popular-posts'),
  title: z.string().optional(),
  description: z.string().optional(),
  featuredPost: z.object({
    title: z.string().optional(),
    excerpt: z.string().optional(),
    imageUrl: z.string().optional(),
    readTime: z.string().optional(),
    publishDate: z.string().optional(),
    category: z.string().optional()
  }).optional(),
  sidePosts: z.array(z.object({
    title: z.string().optional(),
    excerpt: z.string().optional(),
    imageUrl: z.string().optional(),
    readTime: z.string().optional(),
    publishDate: z.string().optional()
  })).optional()
});

export const BreadcrumbSchema = z.object({
  enabled: z.boolean(),
  items: z.array(z.object({
    label: z.string(),
    href: z.string().optional()
  }))
});

// Breadcrumb section for content builder
export const BreadcrumbSectionSchema = z.object({
  type: z.literal('breadcrumb'),
  enabled: z.boolean().optional(),
  items: z.array(z.object({
    label: z.string().optional(),
    href: z.string().optional()
  })).optional(),
  // Styling options
  style: z.object({
    separator: z.enum(['>', '→', '|', '/']),
    textSize: z.enum(['sm', 'base', 'lg']),
    showHomeIcon: z.boolean(),
    color: z.enum(['gray', 'blue', 'black'])
  }).optional()
});

export const ArticleWithImageSectionSchema = z.object({
  type: z.literal('article'),
  title: z.string().optional(),
  content: z.string().optional(),
  changingImages: z.array(z.object({
    url: z.string().optional(),
    altText: z.string().optional(),
    caption: z.string().optional(),
    order: z.number().optional()
  })).optional(),
  pinnedImage: z.object({
    url: z.string().optional(),
    altText: z.string().optional(),
    caption: z.string().optional()
  }).optional(),
  layout: z.object({
    imageSize: z.enum(['small', 'medium', 'large']).optional(),
    showPinnedImage: z.boolean().optional(),
    showChangingImages: z.boolean().optional()
  }).optional(),
  animation: z.object({
    enabled: z.boolean().optional(),
    type: z.enum(['fadeIn', 'slideUp', 'none']).optional(),
    duration: z.number().optional(),
    delay: z.number().optional()
  }).optional()
});

export const VideoSectionSchema = z.object({
  type: z.literal('video'),
  videoUrl: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  width: z.number().optional(),
  alignment: z.enum(['left', 'center', 'right']).optional(),
  autoplay: z.boolean().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
  controls: z.boolean().optional(),
  poster: z.string().optional(),
  // Overlapping positioning options
  height: z.object({
    mobile: z.string(),
    tablet: z.string(),
    desktop: z.string()
  }).optional(),
  // Styling options
  rounded: z.boolean().optional(),
  shadow: z.boolean().optional(),
  // Animation settings
  animation: z.object({
    enabled: z.boolean().optional(),
    type: z.enum(['fadeIn', 'slideUp', 'scaleIn', 'none']).optional(),
    duration: z.number().min(0.1).max(3).optional(),
    delay: z.number().min(0).max(2).optional()
  }).optional()
});

// Content section union type
export const ContentSectionSchema = z.discriminatedUnion('type', [
  HeroSectionSchema,
  TextSectionSchema,
  ImageSectionSchema,
  GallerySectionSchema,
  PopularPostsSectionSchema,
  BreadcrumbSectionSchema,
  ArticleWithImageSectionSchema,
  VideoSectionSchema
]);

// Content page schema
export const ContentPageSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters'),
  content: z.string().min(1, 'Content is required'),
  contentSections: z.array(ContentSectionSchema),
  status: z.enum(['draft', 'published', 'archived']),
  seoTitle: z.string().max(60, 'SEO title must be less than 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  featuredImage: z.string().optional(),
  publishedAt: z.date().optional(),
  updatedAt: z.date().optional(),
  lastSyncedAt: z.date().optional(),
});

// Base post schema for drafts
export const PostDraftSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters'),
  body: z.string().optional(),
  contentSections: z.array(ContentSectionSchema).default([]),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  featuredImage: z.union([
    z.string().refine((val) => {
      return /^(https?:\/\/.+|data:image\/[a-zA-Z]+;base64,.+)$/.test(val);
    }, 'Featured image must be a valid URL or base64 data URL'),
    z.object({
      url: z.string().refine((val) => {
        return /^(https?:\/\/.+|data:image\/[a-zA-Z]+;base64,.+)$/.test(val);
      }, 'Featured image URL must be valid'),
      alt: z.string().optional(),
      caption: z.string().optional()
    })
  ]).optional(),
  featuredMedia: z.object({
    url: z.string().refine((val) => {
      return /^(https?:\/\/.+|data:image\/[a-zA-Z]+;base64,.+|data:video\/[a-zA-Z]+;base64,.+)$/.test(val);
    }, 'Featured media URL must be valid'),
    alt: z.string().optional(),
    caption: z.string().optional(),
    type: z.enum(['image', 'video']),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional()
  }).optional(),
  seoTitle: z.string().max(60, 'SEO title must be less than 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
  breadcrumb: BreadcrumbSchema.default({ enabled: true, items: [{ label: 'Home', href: '/' }, { label: 'Destinations', href: '#destinations' }] }),
  readingTime: z.number().optional(),
  jsonLd: z.boolean().default(false),
});

// Extended schema for publishing (requires body and tags)
export const PostPublishSchema = PostDraftSchema.extend({
  body: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required for publishing'),
  status: z.enum(['review', 'scheduled', 'published']),
  scheduledAt: z.date().optional(),
  // Override featured image validation to be more lenient for publishing
  featuredImage: z.union([
    z.string().refine((val) => {
      if (!val || val.trim() === '') return true; // Allow empty strings
      return /^(https?:\/\/.+|data:image\/[a-zA-Z]+;base64,.+)$/.test(val);
    }, 'Featured image must be a valid URL or base64 data URL'),
    z.object({
      url: z.string().refine((val) => {
        if (!val || val.trim() === '') return true; // Allow empty URLs
        return /^(https?:\/\/.+|data:image\/[a-zA-Z]+;base64,.+)$/.test(val);
      }, 'Featured image URL must be valid'),
      alt: z.string().optional(),
      caption: z.string().optional()
    })
  ]).optional(),
}).refine(
  (data) => {
    // If status is scheduled, scheduledAt must be provided and in the future
    if (data.status === 'scheduled') {
      return data.scheduledAt && data.scheduledAt > new Date();
    }
    return true;
  },
  {
    message: 'Scheduled date must be in the future',
    path: ['scheduledAt'],
  }
);

// Media upload validation
export const MediaUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['image', 'video']),
  sizeKB: z.number().max(25000, 'File size must be less than 25MB'),
});

// Search and filter schemas
export const PostSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'draft', 'review', 'scheduled', 'published']).default('all'),
  author: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Bulk action schema
export const BulkActionSchema = z.object({
  action: z.enum(['changeStatus', 'delete']),
  postIds: z.array(z.string()).min(1, 'Select at least one post'),
  status: z.enum(['draft', 'review', 'scheduled', 'published']).optional(),
});

export type PostDraft = z.infer<typeof PostDraftSchema>;
export type PostPublish = z.infer<typeof PostPublishSchema>;
export type MediaUpload = z.infer<typeof MediaUploadSchema>;
export type PostSearch = z.infer<typeof PostSearchSchema>;
export type BulkAction = z.infer<typeof BulkActionSchema>;

// Content section types
export type HeroSection = z.infer<typeof HeroSectionSchema>;
export type TextSection = z.infer<typeof TextSectionSchema>;
export type ImageSection = z.infer<typeof ImageSectionSchema>;
export type GallerySection = z.infer<typeof GallerySectionSchema>;
export type PopularPostsSection = z.infer<typeof PopularPostsSectionSchema>;
export type BreadcrumbSection = z.infer<typeof BreadcrumbSectionSchema>;
export type ArticleWithImageSection = z.infer<typeof ArticleWithImageSectionSchema>;
export type VideoSection = z.infer<typeof VideoSectionSchema>;
export type ContentSection = z.infer<typeof ContentSectionSchema>;
export type Breadcrumb = z.infer<typeof BreadcrumbSchema>;

// Contact form validation schemas
export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject cannot exceed 200 characters'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message cannot exceed 5000 characters'),
  source: z.string().default('website'),
  referrer: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
});

export const ContactUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const ContactSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'new', 'read', 'replied', 'archived']).default('all'),
  priority: z.enum(['all', 'low', 'medium', 'high', 'urgent']).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Newsletter validation schemas
export const NewsletterSubscriptionSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  source: z.enum(['website', 'popup', 'footer', 'admin', 'import']).default('website'),
  preferences: z.object({
    frequency: z.enum(['weekly', 'monthly', 'quarterly']).default('monthly'),
    categories: z.array(z.string()).default([]),
    language: z.string().default('en'),
  }).default({
    frequency: 'monthly',
    categories: [],
    language: 'en',
  }),
  referrer: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
});

export const NewsletterUpdateSchema = z.object({
  status: z.enum(['active', 'unsubscribed', 'bounced', 'complained']).optional(),
  preferences: z.object({
    frequency: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
    categories: z.array(z.string()).optional(),
    language: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const NewsletterSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'unsubscribed', 'bounced', 'complained']).default('all'),
  frequency: z.enum(['all', 'weekly', 'monthly', 'quarterly']).default('all'),
  source: z.enum(['all', 'website', 'popup', 'footer', 'admin', 'import']).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Bulk action schemas
export const ContactBulkActionSchema = z.object({
  action: z.enum(['changeStatus', 'changePriority', 'delete']),
  contactIds: z.array(z.string()).min(1, 'Select at least one contact'),
  status: z.enum(['new', 'read', 'replied', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const NewsletterBulkActionSchema = z.object({
  action: z.enum(['changeStatus', 'unsubscribe', 'delete']),
  newsletterIds: z.array(z.string()).min(1, 'Select at least one subscriber'),
  status: z.enum(['active', 'unsubscribed', 'bounced', 'complained']).optional(),
});

// User schemas
export const UserSearchSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['all', 'admin', 'editor', 'contributor']).default('all'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const UserRoleUpdateSchema = z.object({
  role: z.enum(['admin', 'editor', 'contributor'], {
    message: 'Role must be admin, editor, or contributor',
  }),
});

export const UserStatusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    message: 'Status must be active or inactive',
  }),
});

export const UserBulkActionSchema = z.object({
  action: z.enum(['changeRole', 'changeStatus', 'delete']),
  userIds: z.array(z.string()).min(1, 'Select at least one user'),
  role: z.enum(['admin', 'editor', 'contributor']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// Export types
export type ContactForm = z.infer<typeof ContactFormSchema>;
export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;
export type ContactSearch = z.infer<typeof ContactSearchSchema>;
export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;
export type NewsletterUpdate = z.infer<typeof NewsletterUpdateSchema>;
export type NewsletterSearch = z.infer<typeof NewsletterSearchSchema>;
export type ContactBulkAction = z.infer<typeof ContactBulkActionSchema>;
export type NewsletterBulkAction = z.infer<typeof NewsletterBulkActionSchema>;
export type ContentPage = z.infer<typeof ContentPageSchema>;
export type UserSearch = z.infer<typeof UserSearchSchema>;
export type UserRoleUpdate = z.infer<typeof UserRoleUpdateSchema>;
export type UserStatusUpdate = z.infer<typeof UserStatusUpdateSchema>;
export type UserBulkAction = z.infer<typeof UserBulkActionSchema>;

