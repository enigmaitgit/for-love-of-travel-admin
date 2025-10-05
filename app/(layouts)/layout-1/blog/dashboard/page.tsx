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

export default function BlogDashboard() {
  const [, setIsLoading] = useState(true);
  const [, setWidgets] = useState({
    newPosts: { count: 0, change: 0, period: '24h' },
    pendingReviews: { count: 0, change: 0, period: '7d' },
    commentsQueue: { count: 0, change: 0, period: '24h' },
    newSubscribers: { count: 0, change: 0, period: '7d' },
    adFillRate: { count: 0, change: 0, period: '7d' },
    revenue: { count: 0, change: 0, period: '7d' },
    ctr: { count: 0, change: 0, period: '7d' },
  });

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setWidgets({
        newPosts: { count: 12, change: 15.3, period: '24h' },
        pendingReviews: { count: 8, change: -5.2, period: '7d' },
        commentsQueue: { count: 23, change: 8.7, period: '24h' },
        newSubscribers: { count: 156, change: 22.1, period: '7d' },
        adFillRate: { count: 87.5, change: 3.2, period: '7d' },
        revenue: { count: 2450, change: 12.8, period: '7d' },
        ctr: { count: 2.4, change: -0.8, period: '7d' },
      });
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);


  // Sample data for the new dashboard sections
  const contributors = [
    { 
      name: 'Tyler Hero', 
      avatar: '300-3.png', 
      connections: 6, 
      connected: false
    },
    { 
      name: 'Esther Howard', 
      avatar: '300-1.png', 
      connections: 29, 
      connected: true
    },
    { 
      name: 'Cody Fisher', 
      avatar: '300-14.png', 
      connections: 34, 
      connected: false
    },
    { 
      name: 'Arlene McCoy', 
      avatar: '300-7.png', 
      connections: 1, 
      connected: true
    },
  ];

  const newPosts = [
    {
      id: 1,
      image: 'posts/new-posts/post-1.jpg',
      title: 'The Impact of Technology on the Workplace: How Technology is Changing',
      readTime: '14 min read',
      date: 'May 28, 2025'
    },
    {
      id: 2,
      image: 'posts/new-posts/post-2.jpg',
      title: 'The Impact of Technology on the Workplace: How Technology is Changing',
      readTime: '14 min read',
      date: 'May 28, 2025'
    },
    {
      id: 3,
      image: 'posts/new-posts/post-3.jpg',
      title: 'The Impact of Technology on the Workplace: How Technology is Changing',
      readTime: '14 min read',
      date: 'May 28, 2025'
    },
    {
      id: 4,
      image: 'posts/new-posts/post-4.jpg',
      title: 'The Impact of Technology on the Workplace: How Technology is Changing',
      readTime: '14 min read',
      date: 'May 2, 2025'
    },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState('lastModified');
  const [sortOrder, setSortOrder] = useState('desc');
  const [commentsData, setCommentsData] = useState([
    {
      id: 1,
      post: 'The Impact of Technology on the Workplace: How Technology is Changing',
      rating: 5,
      lastModified: '21 Oct, 2024',
      contributors: ['300-1.png', '300-2.png', '300-3.png'],
      status: 'approved',
      author: 'John Doe',
      content: 'Great insights on workplace technology trends!',
      likes: 12,
      replies: 3
    },
    {
      id: 2,
      post: 'The Impact of Technology on the Workplace: How Technology is Changing',
      rating: 4,
      lastModified: '20 Oct, 2024',
      contributors: ['300-4.png', '300-5.png', '300-6.png'],
      status: 'pending',
      author: 'Jane Smith',
      content: 'I have some questions about the implementation...',
      likes: 8,
      replies: 1
    },
    {
      id: 3,
      post: 'The Impact of Technology on the Workplace: How Technology is Changing',
      rating: 5,
      lastModified: '19 Oct, 2024',
      contributors: ['300-7.png', '300-8.png'],
      status: 'approved',
      author: 'Mike Johnson',
      content: 'This article really opened my eyes to new possibilities.',
      likes: 15,
      replies: 5
    },
    {
      id: 4,
      post: 'The Impact of Technology on the Workplace: How Technology is Changing',
      rating: 3,
      lastModified: '18 Oct, 2024',
      contributors: ['300-9.png', '300-10.png', '300-11.png'],
      status: 'spam',
      author: 'Sarah Wilson',
      content: 'I disagree with some of the points made here.',
      likes: 2,
      replies: 0
    },
    {
      id: 5,
      post: 'The Impact of Technology on the Workplace: How Technology is Changing',
      rating: 5,
      lastModified: '17 Oct, 2024',
      contributors: ['300-12.png'],
      status: 'approved',
      author: 'David Brown',
      content: 'Excellent research and well-written article!',
      likes: 20,
      replies: 2
    },
  ]);

  // Filter and sort comments
  const filteredComments = commentsData
    .filter(comment => 
      comment.post.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'lastModified') {
        return sortOrder === 'asc' 
          ? new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
          : new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      if (sortBy === 'rating') {
        return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
      }
      if (sortBy === 'likes') {
        return sortOrder === 'asc' ? a.likes - b.likes : b.likes - a.likes;
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComments = filteredComments.slice(startIndex, startIndex + itemsPerPage);

  const handleStatusChange = (commentId: number, newStatus: string) => {
    setCommentsData(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { ...comment, status: newStatus }
          : comment
      )
    );
  };

  const handleDeleteComment = (commentId: number) => {
    setCommentsData(prevComments => 
      prevComments.filter(comment => comment.id !== commentId)
    );
  };

  // Analytics Data
  const analyticsData = {
    overview: {
      totalViews: 125000,
      totalPosts: 45,
      totalComments: 234,
      totalUsers: 1200,
      viewsChange: 12.5,
      postsChange: 8.2,
      commentsChange: -3.1,
      usersChange: 15.7
    },
    recentMetrics: {
      newPosts24h: 3,
      newPosts7d: 12,
      pendingReviews: 8,
      commentsInQueue: 15,
      newSubscribers24h: 45,
      newSubscribers7d: 280,
      adFillRate: 87.5,
      revenue: 2450,
      ctr: 3.2
    },
    monthlyViews: [
      { month: 'Jan', views: 12000, posts: 3, comments: 18 },
      { month: 'Feb', views: 15000, posts: 4, comments: 22 },
      { month: 'Mar', views: 18000, posts: 5, comments: 28 },
      { month: 'Apr', views: 22000, posts: 6, comments: 35 },
      { month: 'May', views: 25000, posts: 7, comments: 42 },
      { month: 'Jun', views: 35000, posts: 8, comments: 58 },
      { month: 'Jul', views: 28000, posts: 6, comments: 45 },
      { month: 'Aug', views: 30000, posts: 7, comments: 52 },
      { month: 'Sep', views: 32000, posts: 8, comments: 48 },
      { month: 'Oct', views: 38000, posts: 9, comments: 65 },
      { month: 'Nov', views: 40000, posts: 10, comments: 72 },
      { month: 'Dec', views: 35000, posts: 8, comments: 58 },
    ],
    topPosts: [
      { title: 'Hidden Gems of Southeast Asia: 15 Secret Destinations', views: 15420, comments: 23, rating: 4.8 },
      { title: 'Solo Travel Safety Guide: Tips for Female Travelers', views: 12850, comments: 18, rating: 4.6 },
      { title: 'Budget Travel Hacks: How to See the World for Less', views: 11200, comments: 15, rating: 4.7 },
      { title: 'Best Time to Visit Europe: Seasonal Travel Guide', views: 9800, comments: 12, rating: 4.5 },
      { title: 'Backpacking Through Japan: Complete 2-Week Itinerary', views: 8750, comments: 10, rating: 4.9 }
    ],
    trafficSources: [
      { source: 'Organic Search', percentage: 45, visitors: 56250 },
      { source: 'Direct', percentage: 25, visitors: 31250 },
      { source: 'Social Media', percentage: 15, visitors: 18750 },
      { source: 'Referrals', percentage: 10, visitors: 12500 },
      { source: 'Email', percentage: 5, visitors: 6250 }
    ]
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
          <Button variant="outline" onClick={() => setIsLoading(true)} className="hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw className="mr-2 h-4 w-4" />
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
            <div className="flex flex-col gap-3">
              {contributors.map((contributor, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center grow gap-3">
                    <img
                      src={`/media/avatars/${contributor.avatar}`}
                      className="rounded-full size-9 shrink-0 border-2 border-gray-100 dark:border-gray-700"
                      alt="image"
                    />
                    <div className="flex flex-col">
                      <Link
                        href="#"
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {contributor.name}
                      </Link>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" mode="icon" className="h-7 w-7">
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-2 justify-center">
            <Button mode="link" underlined="dashed" asChild className="text-blue-600 hover:text-blue-700">
              <Link href="/public-profile/network">All Contributors</Link>
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
              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex space-x-4">
                {newPosts.map((post) => (
                  <Card key={post.id} className="min-w-[280px] shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0">
                    <div
                      className="rounded-t-xl w-[280px] h-[180px] bg-cover bg-center relative overflow-hidden"
                      style={{
                        backgroundImage: `url(/media/${post.image})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
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
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Author</div>
                <div>Post</div>
                <div>Rating</div>
                <div>Status</div>
                <div>Last Modified</div>
                <div>Actions</div>
              </div>
              {paginatedComments.map((comment) => (
                <div key={comment.id} className="grid grid-cols-6 gap-4 items-center py-3 border-b hover:bg-gray-50 rounded-lg px-2">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={`/media/avatars/${comment.contributors[0]}`}
                      alt={comment.author}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium">{comment.author}</div>
                      <div className="text-xs text-muted-foreground">{comment.likes} likes</div>
                    </div>
                  </div>
                  <div className="text-sm line-clamp-2">
                    <div className="font-medium">{comment.post}</div>
                    <div className="text-muted-foreground text-xs mt-1">{comment.content}</div>
                  </div>
                  <div className="flex items-center">
                    {[...Array(comment.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
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
                          : 'bg-red-100 text-red-700 border border-red-300'
                      }`}
                    >
                      {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {comment.lastModified}
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
                        <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'approved')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'pending')}>
                          <Clock className="mr-2 h-4 w-4" />
                          Mark Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(comment.id, 'rejected')}>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
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
            </div>
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
                   <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.overview.totalViews.toLocaleString()}</p>
                   <div className="flex items-center mt-1">
                     <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                     <span className="text-sm text-green-500 font-medium">+{analyticsData.overview.viewsChange}%</span>
                   </div>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analyticsData.overview.totalPosts}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500 font-medium">+{analyticsData.overview.postsChange}%</span>
                  </div>
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