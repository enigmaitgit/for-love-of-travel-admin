import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, User, Tag, Folder, ExternalLink, Image, Clock, Video } from 'lucide-react';
import Link from 'next/link';
import { Layout1 } from '@/components/layouts/layout-1';
import { getPost } from '@/lib/api-client';
import { ContentSection, VideoSection } from '@/lib/validation';

// Helper function to get image display URL
const getImageDisplayUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('/')) return imageUrl;
  return imageUrl;
};

// Helper function to get media display URL (for both images and videos)
const getMediaDisplayUrl = (mediaUrl: string): string => {
  if (!mediaUrl) return '';
  if (mediaUrl.startsWith('http')) return mediaUrl;
  if (mediaUrl.startsWith('/')) return mediaUrl;
  if (mediaUrl.startsWith('data:')) return mediaUrl;
  
  // For admin backend media files, construct proper URL
  return `http://localhost:5000/api/v1/media/serve/${encodeURIComponent(mediaUrl)}`;
};

// Helper components for popular posts preview (server-side compatible)
const FeaturedPostImage = ({ imageUrl, title, excerpt }: { imageUrl?: string; title: string; excerpt: string }) => {
  const resolvedImageUrl = getImageDisplayUrl(imageUrl || '');

  if (!resolvedImageUrl) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
        <div className="text-center text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No Image</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={resolvedImageUrl}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm opacity-90 line-clamp-2">{excerpt}</p>
      </div>
    </>
  );
};

const SidePostItem = ({ post, postIndex }: { post: unknown; postIndex: number }) => {
  const postData = post as { imageUrl?: string; title?: string; excerpt?: string };
  const resolvedImageUrl = getImageDisplayUrl(postData?.imageUrl || '');

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="flex h-24">
        <div className="relative w-24 h-full flex-shrink-0">
          {resolvedImageUrl ? (
            <img
              src={resolvedImageUrl}
              alt={postData?.title || 'Post image'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Image className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-center">
          <h4 className="font-medium text-sm line-clamp-2 mb-1">
            {postData?.title || `Post ${postIndex + 1}`}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {postData?.excerpt || 'Post excerpt...'}
          </p>
        </div>
      </div>
    </div>
  );
};

interface PreviewPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Content Section Renderer Component
function ContentSectionRenderer({ section }: { section: ContentSection }) {
  switch (section.type) {
    case 'hero':
      return (
        <div className="relative overflow-hidden rounded-lg">
          {section.backgroundVideo ? (
            <div 
              className="relative"
              style={{
                height: section.height?.desktop || '90vh'
              }}
            >
              <video
                src={getMediaDisplayUrl(section.backgroundVideo)}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: section.overlayOpacity || 0.3 }}
              />
              <div className="relative z-10 flex items-center justify-center h-full px-8">
                <div className="text-center text-white max-w-4xl">
                  {section.title && (
                    <h1 className={`font-bold mb-4 ${section.titleSize?.desktop || 'text-6xl'}`}>
                      {section.title}
                    </h1>
                  )}
                  {section.subtitle && (
                    <p className="text-xl mb-6 opacity-90">{section.subtitle}</p>
                  )}
                  {(section.author || section.publishDate || section.readTime) && (
                    <div className="flex items-center justify-center gap-4 text-sm opacity-80">
                      {section.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{section.author}</span>
                        </div>
                      )}
                      {section.publishDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{section.publishDate}</span>
                        </div>
                      )}
                      {section.readTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{section.readTime}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : section.backgroundImage ? (
            <div 
              className="relative bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${getMediaDisplayUrl(section.backgroundImage)})`,
                backgroundPosition: section.backgroundPosition || 'center',
                backgroundSize: section.backgroundSize || 'cover',
                height: section.height?.desktop || '90vh'
              }}
            >
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: section.overlayOpacity || 0.3 }}
              />
              <div className="relative z-10 flex items-center justify-center h-full px-8">
                <div className="text-center text-white max-w-4xl">
                  {section.title && (
                    <h1 className={`font-bold mb-4 ${section.titleSize?.desktop || 'text-6xl'}`}>
                      {section.title}
                    </h1>
                  )}
                  {section.subtitle && (
                    <p className="text-xl mb-6 opacity-90">{section.subtitle}</p>
                  )}
                  {(section.author || section.publishDate || section.readTime) && (
                    <div className="flex items-center justify-center gap-4 text-sm opacity-80">
                      {section.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{section.author}</span>
                        </div>
                      )}
                      {section.publishDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{section.publishDate}</span>
                        </div>
                      )}
                      {section.readTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{section.readTime}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="relative bg-muted flex items-center justify-center"
              style={{
                height: section.height?.desktop || '90vh'
              }}
            >
              <div className="text-center text-muted-foreground">
                <Image className="w-16 h-16 mx-auto mb-4" />
                <p>No background media</p>
              </div>
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="prose prose-lg max-w-none">
          {section.content && (
            <div 
              dangerouslySetInnerHTML={{ __html: section.content }}
              className="leading-relaxed"
            />
          )}
        </div>
      );

    case 'image':
      return (
        <div className={`flex ${section.alignment === 'center' ? 'justify-center' : section.alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-full ${section.rounded ? 'rounded-lg' : ''} ${section.shadow ? 'shadow-lg' : ''}`}>
            {section.imageUrl ? (
              <img
                src={getMediaDisplayUrl(section.imageUrl)}
                alt={section.altText || ''}
                className="w-full h-auto"
              />
            ) : (
              <div className="w-full h-64 bg-muted flex items-center justify-center rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p>No image</p>
                </div>
              </div>
            )}
            {section.caption && (
              <p className="text-sm text-muted-foreground mt-2 text-center italic">
                {section.caption}
              </p>
            )}
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${section.columns || 3}, 1fr)` }}>
          {section.images && section.images.length > 0 ? (
            section.images.map((image, index) => (
              <div key={index} className="relative group">
                {image.url ? (
                  <img
                    src={getMediaDisplayUrl(image.url)}
                    alt={image.altText || ''}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center rounded-lg">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                {image.caption && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {image.caption}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-2" />
              <p>No images in gallery</p>
            </div>
          )}
        </div>
      );

    case 'article':
      return (
        <div className="space-y-6">
          {section.title && (
            <h2 className="text-3xl font-bold">{section.title}</h2>
          )}
          {section.content && (
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
          {section.pinnedImage && section.pinnedImage.url && (
            <div className="flex justify-center">
              <img
                src={getMediaDisplayUrl(section.pinnedImage.url)}
                alt={section.pinnedImage.altText || ''}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
          {section.changingImages && section.changingImages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.changingImages.map((image, index) => (
                <div key={index}>
                  {image.url ? (
                    <img
                      src={getMediaDisplayUrl(image.url)}
                      alt={image.altText || ''}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center rounded-lg">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'popular-posts':
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
        </div>
      );

    case 'breadcrumb':
      return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          {section.items && section.items.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      );

    case 'video':
      const videoSection = section as VideoSection;
      return (
        <div className="space-y-4">
          {videoSection.title && (
            <h3 className="text-2xl font-bold">{videoSection.title}</h3>
          )}
          
          {videoSection.description && (
            <p className="text-muted-foreground">{videoSection.description}</p>
          )}

          {videoSection.videoUrl ? (
            <div className="relative">
              <video
                src={getMediaDisplayUrl(videoSection.videoUrl)}
                poster={videoSection.poster ? getMediaDisplayUrl(videoSection.poster) : undefined}
                className={`max-w-full h-auto ${
                  videoSection.rounded ? 'rounded-lg' : ''
                } ${videoSection.shadow ? 'shadow-lg' : ''}`}
                style={{
                  width: videoSection.width ? `${videoSection.width}px` : 'auto',
                  height: videoSection.height ? `${videoSection.height}px` : 'auto'
                }}
                controls={videoSection.controls}
                autoPlay={videoSection.autoplay}
                muted={videoSection.muted}
                loop={videoSection.loop}
                preload="metadata"
              />
              {!videoSection.controls && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <div className="bg-black/50 rounded-full p-3">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <p>No video selected</p>
              </div>
            </div>
          )}
          
          {videoSection.caption && (
            <p className="text-sm text-muted-foreground italic">
              {videoSection.caption}
            </p>
          )}
        </div>
      );

    default:
      return (
        <div className="bg-muted/50 p-4 rounded-lg text-center text-muted-foreground">
          <p>Unsupported content section: {(section as { type: string }).type}</p>
        </div>
      );
  }
}

export default async function PreviewPostPage({ params }: PreviewPostPageProps) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;
  
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
            {/* Featured Media (Image or Video) */}
            {(() => {
              // Priority: featuredMedia > featuredImage
              const featuredMedia = post.featuredMedia;
              const featuredImage = post.featuredImage;
              
              if (featuredMedia?.type === 'video' && featuredMedia?.url) {
                return (
                  <div className="relative h-80 md:h-96 lg:h-[28rem]">
                    <video
                      src={getMediaDisplayUrl(featuredMedia.url)}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        Video
                      </Badge>
                    </div>
                  </div>
                );
              } else if (featuredImage) {
                const imageUrl = typeof featuredImage === 'string' ? featuredImage : featuredImage.url;
                return (
                  <div className="relative h-80 md:h-96 lg:h-[28rem]">
                    <img
                      src={getMediaDisplayUrl(imageUrl)}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                );
              }
              return null;
            })()}

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
                  <span>By {post.author || 'Unknown'}</span>
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
                {post.contentSections && post.contentSections.length > 0 ? (
                  <div className="space-y-8">
                    {post.contentSections.map((section, index) => (
                      <ContentSectionRenderer key={index} section={section} />
                    ))}
                  </div>
                ) : post.body ? (
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
                          {typeof category === 'string' ? category : (category as { name?: string })?.name}
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
