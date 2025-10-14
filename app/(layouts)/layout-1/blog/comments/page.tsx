'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
  Calendar,
  Ban,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CommentModerationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  const [selectedComment, setSelectedComment] = useState<{
    id: number;
    author: string;
    email: string;
    content: string;
    post: string;
    postSlug: string;
    postId: number;
    status: string;
    reason?: string | null;
    reportedBy?: string | null;
    createdAt: string;
    isSpam?: boolean;
    isOffensive?: boolean;
    avatar?: string;
    likes?: number;
    dislikes?: number;
    reports?: number;
  } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  const [comments, setComments] = useState<{
    id: number;
    author: string;
    email: string;
    content: string;
    post: string;
    postSlug: string;
    postId: number;
    status: string;
    reason?: string | null;
    reportedBy?: string | null;
    createdAt: string;
    isSpam?: boolean;
    isOffensive?: boolean;
    avatar?: string;
    reports?: number;
    likes?: number;
    dislikes?: number;
  }[]>([]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'reported':
        return <Badge className="bg-orange-100 text-orange-800">Reported</Badge>;
      case 'spam':
        return <Badge className="bg-red-100 text-red-800">Spam</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason: string | null) => {
    if (!reason) return null;
    switch (reason) {
      case 'spam':
        return <Badge className="bg-red-100 text-red-800">Spam</Badge>;
      case 'inappropriate':
        return <Badge className="bg-orange-100 text-orange-800">Inappropriate</Badge>;
      case 'harassment':
        return <Badge className="bg-red-100 text-red-800">Harassment</Badge>;
      case 'misinformation':
        return <Badge className="bg-yellow-100 text-yellow-800">Misinformation</Badge>;
      case 'off-topic':
        return <Badge className="bg-blue-100 text-blue-800">Off-topic</Badge>;
      case 'other':
        return <Badge className="bg-gray-100 text-gray-800">Other</Badge>;
      default:
        return <Badge variant="secondary">{reason}</Badge>;
    }
  };

  const filteredComments = comments
    .filter(comment => {
      const matchesSearch = comment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           comment.post.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || comment.status === statusFilter;
      const matchesReason = reasonFilter === 'all' || comment.reason === reasonFilter;
      return matchesSearch && matchesStatus && matchesReason;
    })
    .sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortBy) {
        case 'likes':
          aValue = a.likes || 0;
          bValue = b.likes || 0;
          break;
        case 'dislikes':
          aValue = a.dislikes || 0;
          bValue = b.dislikes || 0;
          break;
        case 'reports':
          aValue = a.reports || 0;
          bValue = b.reports || 0;
          break;
        case 'author':
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

  const handleSelectComment = (commentId: number) => {
    setSelectedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedComments.length === filteredComments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(filteredComments.map(c => c.id));
    }
  };

  const handleModerateComment = async (commentId: number, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action,
          reason: reason 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Comment moderated",
          description: `Comment ${action}ed successfully.`,
        });
        // Refresh comments list
        fetchComments();
      } else {
        throw new Error(data.message || 'Failed to moderate comment');
      }
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast({
        title: "Error",
        description: "Failed to moderate comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedComments.length === 0) return;

    try {
      const response = await fetch('/api/admin/comments/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          commentIds: selectedComments,
          action: action 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Bulk action completed",
          description: `${data.results.success} comments ${action}ed successfully.`,
        });
        setSelectedComments([]);
        // Refresh comments list
        fetchComments();
      } else {
        throw new Error(data.message || 'Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch comments from API
  const fetchComments = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/admin/comments?${queryParams}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Transform the data to match the expected format
        const transformedComments = data.data.map((comment: {
          _id: string;
          author: { name: string; email: string };
          content: string;
          postId: { title: string; slug: string; _id: string } | string;
          status: string;
          reports: number;
          likes: number;
          dislikes: number;
          moderation?: { moderationReason?: string; moderatedBy?: { name: string } };
          moderationReason?: string;
          moderatedBy?: { name: string };
          createdAt: string;
        }) => ({
          id: comment._id,
          author: comment.author.name,
          email: comment.author.email,
          content: comment.content,
          post: typeof comment.postId === 'object' ? comment.postId?.title || 'Unknown Post' : 'Unknown Post',
          postSlug: typeof comment.postId === 'object' ? comment.postId?.slug || 'unknown-slug' : 'unknown-slug',
          postId: typeof comment.postId === 'object' ? comment.postId?._id || comment.postId : comment.postId,
          status: comment.reports > 0 ? 'reported' : comment.status, // Override status if reported
          reason: comment.moderation?.moderationReason || comment.moderationReason,
          reportedBy: comment.moderation?.moderatedBy?.name || comment.moderatedBy?.name,
          createdAt: comment.createdAt,
          isSpam: comment.status === 'spam',
          isOffensive: comment.status === 'rejected',
          reports: comment.reports || 0, // Add reports count
          likes: comment.likes || 0, // Add likes count
          dislikes: comment.dislikes || 0, // Add dislikes count
          avatar: '/media/avatars/300-1.png',
        }));
        
        setComments(transformedComments);
      } else {
        // If no comments from backend, set empty array
        console.log('No comments found from backend API');
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch comments. Please check your connection.",
        variant: "destructive",
      });
      setComments([]);
    }
  }, [statusFilter, searchTerm, toast]);

  // Load comments on component mount and when filters change
  useEffect(() => {
    fetchComments();
  }, [statusFilter, searchTerm, fetchComments]);

  const handleViewDetail = (comment: {
    id: number;
    author: string;
    email: string;
    content: string;
    post: string;
    postSlug: string;
    postId: number;
    status: string;
    reason?: string | null;
    reportedBy?: string | null;
    createdAt: string;
    isSpam?: boolean;
    isOffensive?: boolean;
    avatar?: string;
  }) => {
    setSelectedComment(comment);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 ml-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comment Moderation</h1>
          <p className="text-muted-foreground">
            Approve/Reject/Spam comments efficiently
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reported">Reported</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="off-topic">Off-topic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="likes">Likes</SelectItem>
                  <SelectItem value="dislikes">Dislikes</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {selectedComments.length} comment{selectedComments.length > 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedComments([])}>
                  Clear
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('spam')}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Mark as Spam
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comments ({filteredComments.length})</CardTitle>
          <CardDescription>
            Review and moderate comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={() => handleSelectComment(comment.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className={`text-sm ${comment.isOffensive ? 'blur-sm hover:blur-none' : ''}`}>
                        {comment.content.length > 100 
                          ? `${comment.content.substring(0, 100)}...` 
                          : comment.content
                        }
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {comment.isSpam && (
                          <Badge className="bg-red-100 text-red-800">Spam</Badge>
                        )}
                        {(comment.reports || 0) > 0 && (
                          <Badge className="bg-orange-100 text-orange-800">
                            {comment.reports} report{comment.reports > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.avatar} alt={comment.author} />
                        <AvatarFallback>{comment.author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{comment.author}</div>
                        <div className="text-xs text-muted-foreground">{comment.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{comment.post}</div>
                      <div className="text-xs text-muted-foreground">/{comment.postSlug}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell>
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
                          <span className="text-sm font-medium text-orange-700">{comment.reports}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getReasonBadge(comment.reason || null)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetail(comment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleModerateComment(comment.id, 'approve')}
                          className="text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleModerateComment(comment.id, 'reject')}
                          className="text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleModerateComment(comment.id, 'spam')}
                          className="text-orange-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Mark as Spam
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>



      {/* Comment Detail Modal */}
      {selectedComment && isDetailOpen && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Comment Details</CardTitle>
              <Button variant="ghost" onClick={() => {
                setSelectedComment(null);
                setIsDetailOpen(false);
              }}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={selectedComment.avatar} alt={selectedComment.author} />
                <AvatarFallback>{selectedComment.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedComment.author}</div>
                <div className="text-sm text-muted-foreground">{selectedComment.email}</div>
              </div>
            </div>
            
            <div>
              <Label>Comment Content</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm">{selectedComment.content}</p>
              </div>
            </div>
            
            <div>
              <Label>Post Context</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedComment.post}</p>
                <p className="text-xs text-muted-foreground mt-1">Slug: /{selectedComment.postSlug}</p>
              </div>
            </div>
            
            <div>
              <Label>Engagement Metrics</Label>
              <div className="mt-2 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                      <span className="text-lg">👍</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{selectedComment.likes || 0}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                      <span className="text-lg">👎</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700">{selectedComment.dislikes || 0}</div>
                    <div className="text-xs text-muted-foreground">Dislikes</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">{selectedComment.reports || 0}</div>
                    <div className="text-xs text-muted-foreground">Reports</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Net Score:</span>
                    <span className={`font-medium ${((selectedComment.likes || 0) - (selectedComment.dislikes || 0)) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {((selectedComment.likes || 0) - (selectedComment.dislikes || 0)) >= 0 ? '+' : ''}{((selectedComment.likes || 0) - (selectedComment.dislikes || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedComment.status)}</div>
              </div>
              <div>
                <Label>Reason</Label>
                <div className="mt-1">{getReasonBadge(selectedComment.reason || null)}</div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => handleModerateComment(selectedComment.id, 'reject')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                onClick={() => handleModerateComment(selectedComment.id, 'approve')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
