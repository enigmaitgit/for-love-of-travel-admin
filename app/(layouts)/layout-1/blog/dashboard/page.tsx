'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Calendar,
  Video,
  ArrowDownRight,
  Star,
  Search,
  MoreHorizontal,
  EllipsisVertical
} from 'lucide-react';
import { SubscriberMetrics } from '@/components/subscriber-metrics';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useRecentPosts } from '@/hooks/usePosts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRecentComments } from '@/hooks/useComments';
import { useRecentContributors } from '@/hooks/useUsers';
import { useRecentCategories } from '@/hooks/useCategories';
import { format } from 'date-fns';

export default function BlogDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent posts dynamically
  const { recentPosts, loading: postsLoading, error: postsError, refresh: refreshPosts } = useRecentPosts(4);
  
  // Fetch analytics data dynamically
  const { analytics, loading: analyticsLoading, refresh: refreshAnalytics } = useAnalytics();
  
  // Fetch recent comments dynamically
  const { 
    recentComments, 
    loading: commentsLoading, 
    error: commentsError, 
    refresh: refreshComments,
    updateCommentStatus,
    deleteComment
  } = useRecentComments(5);
  
  // Fetch recent contributors dynamically
  const { 
    contributors, 
    loading: contributorsLoading, 
    error: contributorsError, 
    refresh: refreshContributors
  } = useRecentContributors(4);
  
  // Fetch recent categories dynamically
  const { 
    recentCategories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    refresh: refreshCategories
  } = useRecentCategories(6);

  // Set loading state based on analytics data
  useEffect(() => {
    if (!analyticsLoading) {
      setIsLoading(false);
    }
  }, [analyticsLoading]);


  // Contributors data is now fetched dynamically

  // Helper function to get post image
  const getPostImage = (post: { featuredMedia?: { url?: string; type?: string }; featuredImage?: string | { url?: string } }) => {
    // Check for featuredMedia first (videos/images)
    if (post.featuredMedia && post.featuredMedia.url) {
      return post.featuredMedia.url;
    }
    
    // Fallback to featuredImage
    if (post.featuredImage) {
      if (typeof post.featuredImage === 'string') {
        return post.featuredImage;
      } else if (post.featuredImage.url) {
        return post.featuredImage.url;
      }
    }
    return '/media/posts/default-post.jpg'; // fallback image
  };

  // Helper function to get reading time
  const getReadingTime = (post: { readingTime?: number; body?: string }) => {
    if (post.readingTime) {
      return `${post.readingTime} min read`;
    }
    // Estimate reading time based on content length
    const contentLength = post.body?.length || 0;
    const estimatedTime = Math.max(1, Math.ceil(contentLength / 200));
    return `${estimatedTime} min read`;
  };

  // Helper function to format date
  const formatPostDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Recent';
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState('lastModified');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort comments dynamically
  const filteredComments = recentComments
    .filter(comment => 
      (comment.post?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comment.author?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'lastModified') {
        return sortOrder === 'asc' 
          ? new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime()
          : new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'rating') {
        return sortOrder === 'asc' ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'likes') {
        return sortOrder === 'asc' ? (a.likes || 0) - (b.likes || 0) : (b.likes || 0) - (a.likes || 0);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComments = filteredComments.slice(startIndex, startIndex + itemsPerPage);

  const handleStatusChange = async (commentId: string, newStatus: string) => {
    try {
      await updateCommentStatus(commentId, newStatus);
    } catch (error) {
      console.error('Failed to update comment status:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Use dynamic analytics data
  const analyticsData = analytics || {
    overview: {
      totalViews: 0,
      totalPosts: 0,
      totalComments: 0,
      totalUsers: 0,
      viewsChange: 0,
      postsChange: 0,
      commentsChange: 0,
      usersChange: 0
    },
    recentMetrics: {
      newPosts24h: 0,
      newPosts7d: 0,
      pendingReviews: 0,
      commentsInQueue: 0,
      newSubscribers24h: 0,
      newSubscribers7d: 0,
      adFillRate: 0,
      revenue: 0,
      ctr: 0
    },
    monthlyViews: [],
    topPosts: [],
    trafficSources: []
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="ml-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your travel blog performance and manage content
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsLoading(true);
              refreshPosts();
              refreshAnalytics();
              refreshComments();
              refreshContributors();
              refreshCategories();
              // Refresh other widgets after a delay
              setTimeout(() => setIsLoading(false), 1000);
            }} 
            className="hover:bg-gray-50 dark:hover:bg-gray-800"
            disabled={isLoading || postsLoading || analyticsLoading || commentsLoading || contributorsLoading || categoriesLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading || postsLoading || analyticsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/layout-1/blog/posts/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="ml-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Access your most frequently used admin functions</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        <Link href="/layout-1/blog/posts">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-primary/10 rounded-xl shadow-sm">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Posts</h3>
                  <p className="text-xs text-muted-foreground">Manage all posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/posts/new">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-green-500/10 rounded-xl shadow-sm">
                  <Plus className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">New Post</h3>
                  <p className="text-xs text-muted-foreground">Create new post</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/comments">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-blue-500/10 rounded-xl shadow-sm">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Comments</h3>
                  <p className="text-xs text-muted-foreground">Manage comments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/subscribers">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-purple-500/10 rounded-xl shadow-sm">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Subscribers</h3>
                  <p className="text-xs text-muted-foreground">Manage subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/posts/drafts">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-orange-500/10 rounded-xl shadow-sm">
                  <FileText className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Draft Posts</h3>
                  <p className="text-xs text-muted-foreground">Manage drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/posts/scheduled">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-cyan-50 dark:from-gray-800 dark:to-cyan-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-cyan-500/10 rounded-xl shadow-sm">
                  <Calendar className="h-6 w-6 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Scheduled Posts</h3>
                  <p className="text-xs text-muted-foreground">Manage scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/contacts">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-amber-500/10 rounded-xl shadow-sm">
                  <MessageSquare className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Contact Submissions</h3>
                  <p className="text-xs text-muted-foreground">Manage contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/newsletter">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-indigo-500/10 rounded-xl shadow-sm">
                  <Users className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Newsletter Subscribers</h3>
                  <p className="text-xs text-muted-foreground">Manage subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/layout-1/blog/categories">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl shadow-sm">
                  <FileText className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">Categories</h3>
                  <p className="text-xs text-muted-foreground">Manage categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="ml-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dashboard Widgets - Social Media Metrics */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold mt-4">Social Media Metrics</CardTitle>
            <CardDescription className="text-sm mt-4">Track your social media performance</CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriberMetrics />
          </CardContent>
        </Card>

        {/* Contributors */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-6 relative">
            <CardTitle className="text-lg font-semibold mt-4">Contributors</CardTitle>
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" mode="icon" className="h-8 w-8">
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>View All</DropdownMenuItem>
                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {contributorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading contributors...</span>
              </div>
            ) : contributorsError ? (
              <div className="flex items-center justify-center py-8">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="ml-2 text-red-500">Failed to load contributors</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshContributors}
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            ) : contributors.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Users className="h-6 w-6 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">No contributors found</span>
              </div>
            ) : (
              <div className="space-y-3">
                {contributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative">
                        <img
                          src={`/media/avatars/${contributor.avatar}`}
                          className="rounded-full size-12 shrink-0 border-2 border-gray-100 dark:border-gray-700"
                          alt={contributor.name}
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                          contributor.connected ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <Link
                          href="#"
                          className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                        >
                          {contributor.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {contributor.email}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contributor.role === 'editor' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {contributor.role.charAt(0).toUpperCase() + contributor.role.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer">
                            <Users className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 justify-center">
            <Button mode="link" underlined="dashed" asChild className="text-blue-600 hover:text-blue-700">
              <Link href="/public-profile/network">All Contributors</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Categories Overview */}
      <div className="ml-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4 relative">
            <div>
              <CardTitle className="text-lg font-semibold mt-4">Categories</CardTitle>
              <CardDescription className="text-sm mt-1">Content categories and their performance</CardDescription>
            </div>
            <div className="absolute top-4 right-4">
              <Link href="/layout-1/blog/categories">
                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading categories...</span>
              </div>
            ) : categoriesError ? (
              <div className="flex items-center justify-center py-8">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="ml-2 text-red-500">Failed to load categories</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshCategories}
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            ) : recentCategories.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">No categories found</span>
                <Link href="/layout-1/blog/categories/new" className="ml-4">
                  <Button variant="outline" size="sm">
                    Create First Category
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentCategories.map((category) => (
                  <div key={category._id || category.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {category.postCount || 0} posts
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(category.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                            <EllipsisVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="mr-2 h-3 w-3" />
                            View Posts
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="mr-2 h-3 w-3" />
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400">
                            <AlertTriangle className="mr-2 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 justify-center">
            <Button mode="link" underlined="dashed" asChild className="text-blue-600 hover:text-blue-700">
              <Link href="/layout-1/blog/categories">All Categories</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* New Posts */}
      <div className="ml-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4 relative">
            <div>
              <CardTitle className="text-lg font-semibold mt-4">New Posts</CardTitle>
              <CardDescription className="text-sm mt-1">Latest travel blog posts</CardDescription>
            </div>
            <div className="absolute top-4 right-4">
              <Link href="/layout-1/blog/posts">
                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading posts...</span>
              </div>
            ) : postsError ? (
              <div className="flex items-center justify-center py-8">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="ml-2 text-red-500">Failed to load posts</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshPosts}
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">No posts found</span>
                <Link href="/layout-1/blog/posts/new" className="ml-4">
                  <Button variant="outline" size="sm">
                    Create First Post
                  </Button>
                </Link>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="flex space-x-4">
                  {recentPosts.map((post) => (
                    <Card 
                      key={post._id || post.id} 
                      className="min-w-[280px] shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 cursor-pointer"
                      onClick={() => window.open(`/preview/post/${post._id || post.id}`, '_blank')}
                    >
                        <div className="rounded-t-xl w-[280px] h-[180px] relative overflow-hidden bg-muted">
                          {post.featuredMedia?.type === 'video' ? (
                            <video
                              src={getPostImage(post)}
                              className="w-full h-full object-cover"
                              controls={false}
                              muted
                              preload="metadata"
                              onError={(e) => {
                                console.error('Video thumbnail failed to load:', post.title);
                                const target = e.target as HTMLVideoElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.style.backgroundImage = `url(${getPostImage(post)})`;
                                  parent.className += ' bg-cover bg-center';
                                }
                              }}
                            />
                          ) : (
                            <div
                              className="w-full h-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${getPostImage(post)})`,
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                post.status === 'published' 
                                  ? 'bg-green-100 text-green-700 border-green-300' 
                                  : post.status === 'review'
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                  : post.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </Badge>
                            {post.featuredMedia?.type === 'video' && (
                              <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0">
                                <Video className="h-3 w-3 mr-1" />
                                Video
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
                            {post.title || 'Untitled Post'}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getReadingTime(post)}
                            </span>
                            <span>{formatPostDate(post.createdAt)}</span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            By {post.author || 'Unknown Author'}
                          </div>
                        </div>
                      </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Comments */}
      <div className="ml-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4 relative">
            <div>
              <CardTitle className="text-lg font-semibold mt-4">New Comments</CardTitle>
              <CardDescription className="text-sm mt-1">Manage and moderate comments</CardDescription>
            </div>
            <div className="absolute top-4 right-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search comments..." 
                    className="pl-10 w-60 h-9" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border rounded-md px-3 py-1.5 h-9 bg-white dark:bg-gray-800"
                >
                  <option value="lastModified">Sort by Date</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="likes">Sort by Likes</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-9 w-9 p-0"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading comments...</span>
              </div>
            ) : commentsError ? (
              <div className="flex items-center justify-center py-8">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="ml-2 text-red-500">Failed to load comments</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshComments}
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            ) : recentComments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">No comments found</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div>Author</div>
                  <div>Post</div>
                  <div>Engagement</div>
                  <div>Status</div>
                  <div>Last Modified</div>
                  <div>Actions</div>
                </div>
                {paginatedComments.map((comment) => (
                  <div key={comment._id || comment.id} className="grid grid-cols-6 gap-4 items-center py-3 border-b hover:bg-gray-50 rounded-lg px-2">
                    <div className="flex items-center space-x-2">
                      <Image
                        src={comment.author?.avatar || '/media/avatars/300-1.png'}
                        alt={comment.author?.name || 'Unknown'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-sm font-medium">{comment.author?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{comment.author?.email || 'Unknown'}</div>
                      </div>
                    </div>
                    <div className="text-sm line-clamp-2">
                      <div className="font-medium">{comment.post?.title || comment.post?.slug || 'Unknown Post'}</div>
                      <div className="text-muted-foreground text-xs mt-1">{comment.content}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                          <span className="text-xs font-medium text-green-700">👍</span>
                        </div>
                        <span className="text-sm font-medium text-green-700">{comment.likes || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                          <span className="text-xs font-medium text-red-700">👎</span>
                        </div>
                        <span className="text-sm font-medium text-red-700">{comment.dislikes || 0}</span>
                      </div>
                      {(comment.reports || 0) > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
                            <span className="text-xs font-medium text-orange-700">⚠️</span>
                          </div>
                          <span className="text-sm font-medium text-orange-700">{comment.reports || 0}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          comment.status === 'approved' 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : comment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : comment.status === 'spam'
                            ? 'bg-orange-100 text-orange-700 border border-orange-300'
                            : comment.status === 'rejected'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPostDate(comment.updatedAt || comment.createdAt)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(comment._id || comment.id || '', 'approved')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(comment._id || comment.id || '', 'pending')}>
                            <Clock className="mr-2 h-4 w-4" />
                            Mark Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(comment._id || comment.id || '', 'rejected')}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteComment(comment._id || comment.id || '')}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {recentComments.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-sm text-muted-foreground">per page</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredComments.length)} of {filteredComments.length}
                  </span>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboard */}
      <div className="ml-6 space-y-6">
         {/* Overview Metrics */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                   {analyticsLoading ? (
                     <div className="flex items-center">
                       <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                       </div>
                   ) : (
                     <>
                       <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.overview.totalViews.toLocaleString()}</p>
                       <div className="flex items-center mt-1">
                         <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                         <span className="text-sm text-green-500 font-medium">+{analyticsData.overview.viewsChange}%</span>
                       </div>
                     </>
                   )}
                 </div>
                 <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
                   <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                 </div>
               </div>
             </CardContent>
           </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                  {analyticsLoading ? (
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.overview.totalPosts}</p>
                      <div className="flex items-center mt-1">
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-500 font-medium">+{analyticsData.overview.postsChange}%</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.overview.totalComments}</p>
                  <div className="flex items-center mt-1">
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-500 font-medium">{analyticsData.overview.commentsChange}%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.overview.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500 font-medium">+{analyticsData.overview.usersChange}%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Posts (24h)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.recentMetrics.newPosts24h}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analyticsData.recentMetrics.newPosts7d} in 7 days
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.recentMetrics.pendingReviews}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting approval
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comments in Queue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.recentMetrics.commentsInQueue}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Need moderation
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Subscribers (24h)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.recentMetrics.newSubscribers24h}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analyticsData.recentMetrics.newSubscribers7d} in 7 days
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ad Fill Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.recentMetrics.adFillRate}%</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500 font-medium">+2.3%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${analyticsData.recentMetrics.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CTR</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.recentMetrics.ctr}%</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500 font-medium">+0.5%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl flex items-center justify-center">
                  <Eye className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Views Chart */}
      <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
        <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold mt-4">Monthly Views</CardTitle>
              <CardDescription className="text-sm mt-4">Website traffic over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
              <div className="h-80 w-full">
                <div className="flex items-end justify-between h-full space-x-1">
                  {analyticsData.monthlyViews.map((data, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2 flex-1 group">
                      <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm relative">
                        <div
                          className="w-full bg-blue-600 rounded-t-sm transition-all duration-300 hover:bg-blue-700 hover:shadow-lg"
                          style={{ height: `${(data.views / 40000) * 200}px` }}
                        ></div>
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg">
                          <div className="font-semibold">{data.views.toLocaleString()}</div>
                          <div className="text-xs opacity-75">{data.month}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{data.month}</span>
                    </div>
                  ))}
                </div>
          </div>
        </CardContent>
      </Card>

          {/* Traffic Sources */}
      <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
        <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold mt-4">Traffic Sources</CardTitle>
              <CardDescription className="text-sm mt-4">Where your visitors come from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                {analyticsData.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`h-4 w-4 rounded-full shadow-sm ${
                        index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                        index === 3 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}></div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{source.source}</span>
                        <p className="text-xs text-muted-foreground">{source.visitors.toLocaleString()} visitors</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{source.percentage}%</span>
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            index === 1 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            index === 3 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 
                            'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}
                          style={{ width: `${source.percentage}%` }}
                        ></div>
                </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </div>

        {/* Top Performing Posts */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold mt-4">Top Performing Posts</CardTitle>
            <CardDescription className="text-sm mt-4">Your most popular content this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPosts.map((post, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shadow-sm ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                      'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center space-x-6 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span className="font-medium">{post.views.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">{post.comments}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{post.rating}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 font-medium">
                      Trending
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
