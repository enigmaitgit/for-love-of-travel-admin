import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, User, Tag, Folder, Clock } from 'lucide-react';
import Link from 'next/link';
import { Layout1 } from '@/components/layouts/layout-1';

// Helper function to get image display URL
const getImageDisplayUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('/')) return imageUrl;
  if (imageUrl.startsWith('data:')) return imageUrl;
  
  // For admin backend media files, construct proper URL
  return `http://localhost:5000/api/v1/media/serve/${encodeURIComponent(imageUrl)}`;
};

// Simple Post type
interface SimplePost {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  content: string;
  featuredImage?: {
    url: string;
    alt?: string;
    caption?: string;
  };
  tags: string[];
  categories: (string | { _id: string; name: string })[];
  status: 'draft' | 'review' | 'scheduled' | 'published';
  author?: string | { _id: string; email: string; fullname?: string; name?: string };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  readingTime?: number;
}

interface PreviewSimplePostPageProps {
  params: Promise<{ id: string }>;
}

// Function to fetch simple post by ID
async function getSimplePost(id: string): Promise<SimplePost | null> {
  try {
    const response = await fetch(`${process.env.ADMIN_BACKEND_URL || 'http://localhost:5000'}/api/v1/simple-posts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data for preview
    });

    if (!response.ok) {
      console.error('Failed to fetch simple post:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching simple post:', error);
    return null;
  }
}

export default async function PreviewSimplePostPage({ params }: PreviewSimplePostPageProps) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;
  
  let post: SimplePost | null = null;
  let error: string | null = null;

  try {
    post = await getSimplePost(postId);
    if (!post) {
      error = 'Simple post not found';
    }
  } catch (err) {
    console.error('Error fetching simple post:', err);
    error = 'Failed to load simple post';
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      review: 'warning',
      scheduled: 'info',
      published: 'success',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (error || !post) {
    return (
      <Layout1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">{error || 'Simple post not found'}</div>
            <Link href="/layout-1/blog/simple-posts">
              <Button variant="outline" size="sm">
                Back to Simple Posts
              </Button>
            </Link>
          </div>
        </div>
      </Layout1>
    );
  }

  const resolvedImageUrl = getImageDisplayUrl(post.featuredImage?.url || '');

  return (
    <Layout1>
      <div className="space-y-6 ml-6 mr-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Simple Post Preview</h1>
            <p className="text-muted-foreground">
              This is how your simple post will appear to readers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Preview Mode
            </Badge>
            <Link href="/layout-1/blog/simple-posts">
              <Button variant="outline" size="sm">
                Back to Simple Posts
              </Button>
            </Link>
          </div>
        </div>

        {/* Preview Content */}
        <div className="w-full">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4">
              {/* Featured Image */}
              {resolvedImageUrl && (
                <div className="relative w-full h-64 overflow-hidden rounded-lg">
                  <img
                    src={resolvedImageUrl}
                    alt={post.featuredImage?.alt || post.title}
                    className="w-full h-full object-cover"
                  />
                  {post.featuredImage?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3">
                      <p className="text-sm">{post.featuredImage.caption}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Title and Meta */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
                  {getStatusBadge(post.status)}
                </div>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {post.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {typeof post.author === 'string' 
                          ? post.author 
                          : post.author.fullname || post.author.name || post.author.email || 'Unknown Author'
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {post.publishedAt 
                        ? `Published ${formatDate(post.publishedAt)}`
                        : `Created ${formatDate(post.createdAt)}`
                      }
                    </span>
                  </div>
                  {post.readingTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime} min read</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Folder className="h-3 w-3" />
                        {typeof category === 'string' ? category : category.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* SEO Meta */}
                {(post.seo?.metaTitle || post.seo?.metaDescription) && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h3 className="font-medium text-sm">SEO Preview</h3>
                    {post.seo?.metaTitle && (
                      <p className="text-blue-600 text-lg font-medium">{post.seo.metaTitle}</p>
                    )}
                    {post.seo?.metaDescription && (
                      <p className="text-muted-foreground text-sm">{post.seo.metaDescription}</p>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 py-8">
              {/* Content */}
              <div className="prose prose-gray max-w-none dark:prose-invert prose-lg">
                {post.content ? (
                  <div 
                    className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ 
                      __html: post.content.replace(/\n/g, '<br>') 
                    }}
                  />
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <Eye className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-medium mb-2">No content available</p>
                      <p className="text-sm">Add content to see it here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Post Information */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">Post Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Slug:</span>
                    <p className="text-muted-foreground font-mono">{post.slug}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="mt-1">{getStatusBadge(post.status)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-muted-foreground">{formatDate(post.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <p className="text-muted-foreground">{formatDate(post.updatedAt)}</p>
                  </div>
                  {post.publishedAt && (
                    <div>
                      <span className="font-medium">Published:</span>
                      <p className="text-muted-foreground">{formatDate(post.publishedAt)}</p>
                    </div>
                  )}
                  {post.scheduledAt && (
                    <div>
                      <span className="font-medium">Scheduled:</span>
                      <p className="text-muted-foreground">{formatDate(post.scheduledAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout1>
  );
}
