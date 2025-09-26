import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, User, Tag, Folder, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Layout1 } from '@/components/layouts/layout-1';
import { getPost } from '@/lib/api';

interface PreviewPostPageProps {
  params: {
    id: string;
  };
}

export default async function PreviewPostPage({ params }: PreviewPostPageProps) {
  const postId = params.id;
  
  let post;
  let error: string | null = null;

  try {
    post = await getPost(postId);
    if (!post) {
      error = 'Post not found';
    }
  } catch (err) {
    console.error('Error fetching post:', err);
    error = 'Failed to load post';
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

  const formatDate = (date: Date) => {
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
            <div className="text-muted-foreground mb-4">{error || 'Post not found'}</div>
          </div>
        </div>
      </Layout1>
    );
  }

  return (
    <Layout1>
      <div className="space-y-6 ml-6 mr-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Post Preview</h1>
            <p className="text-muted-foreground">
              This is how your post will appear to readers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Preview Mode
            </Badge>
            <Link href="/layout-1/blog/posts">
              <Button variant="outline" size="sm">
                Edit Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Preview Content */}
        <div className="w-full">
          <Card className="overflow-hidden">
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative h-80 md:h-96 lg:h-[28rem]">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}

            <CardHeader className="space-y-6 px-8 py-8">
              {/* Title */}
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                  {post.title}
                </h1>
                {post.seoTitle && post.seoTitle !== post.title && (
                  <p className="text-sm text-muted-foreground mt-3">
                    SEO Title: {post.seoTitle}
                  </p>
                )}
              </div>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>By {post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {formatDate(post.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  <span>/{post.slug}</span>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(post.status)}
                </div>
              </div>

              {/* Meta Description */}
              {post.metaDescription && (
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Meta Description:</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{post.metaDescription}</p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 px-8 py-8">
              {/* Content */}
              <div className="prose prose-gray max-w-none dark:prose-invert prose-lg">
                {post.body ? (
                  <div 
                    className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ 
                      __html: post.body.replace(/\n/g, '<br>') 
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

              {/* Tags and Categories */}
              <div className="border-t pt-8 space-y-6">
                {post.tags && post.tags.length > 0 && (
                  <div>
                    <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {post.categories && post.categories.length > 0 && (
                  <div>
                    <h3 className="text-base font-medium mb-4 flex items-center gap-2">
                      <Folder className="h-5 w-5" />
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {post.categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* JSON-LD Information */}
              {post.jsonLd && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    JSON-LD Structured Data
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    This post will include structured data markup for better SEO and search engine understanding.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Footer */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>Preview Mode</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is how your post will appear to readers when published
                </p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Link href="/layout-1/blog/posts">
                    <Button variant="outline" size="sm">
                      Edit Post
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout1>
  );
}
