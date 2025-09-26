'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Mail, 
  Calendar, 
  Globe, 
  User, 
  ArrowLeft,
  UserX,
  UserCheck,
  Trash2,
  Edit,
  Save,
  X,
  Send,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Newsletter {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  source: 'website' | 'popup' | 'footer' | 'admin' | 'import';
  preferences: {
    frequency: 'weekly' | 'monthly' | 'quarterly';
    categories: string[];
    language: string;
  };
  subscribedAt: string;
  unsubscribedAt?: string;
  lastEmailSent?: string;
  emailCount: number;
  bounceCount: number;
  complaintCount: number;
  tags: string[];
  notes?: string;
  metadata: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

interface NewsletterDetailProps {
  subscriber: Newsletter;
  onBack: () => void;
  onUpdate: (email: string, updates: Partial<Newsletter>) => void;
  onDelete: (email: string) => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'unsubscribed':
      return 'secondary';
    case 'bounced':
      return 'destructive';
    case 'complained':
      return 'destructive';
    default:
      return 'default';
  }
};

const getSourceBadgeVariant = (source: string) => {
  switch (source) {
    case 'website':
      return 'default';
    case 'popup':
      return 'secondary';
    case 'footer':
      return 'outline';
    case 'admin':
      return 'destructive';
    case 'import':
      return 'secondary';
    default:
      return 'default';
  }
};

export function NewsletterDetail({
  subscriber,
  onBack,
  onUpdate,
  onDelete
}: NewsletterDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubscriber, setEditedSubscriber] = useState(subscriber);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onUpdate(subscriber.email, editedSubscriber);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSubscriber(subscriber);
    setIsEditing(false);
  };

  const handleStatusChange = (status: string) => {
    const updates = { status: status as Newsletter['status'] };
    onUpdate(subscriber.email, updates);
  };

  const handleUnsubscribe = () => {
    handleStatusChange('unsubscribed');
  };

  const handleReactivate = () => {
    handleStatusChange('active');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this subscriber?')) {
      onDelete(subscriber.email);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedSubscriber.tags.includes(newTag.trim())) {
      setEditedSubscriber(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedSubscriber(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddCategory = (category: string) => {
    if (!editedSubscriber.preferences.categories.includes(category)) {
      setEditedSubscriber(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          categories: [...prev.preferences.categories, category]
        }
      }));
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setEditedSubscriber(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        categories: prev.preferences.categories.filter(cat => cat !== categoryToRemove)
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletter
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{subscriber.email}</h1>
            <p className="text-muted-foreground">
              Subscribed {format(new Date(subscriber.subscribedAt), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscriber.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnsubscribe}
            >
              <UserX className="h-4 w-4 mr-2" />
              Unsubscribe
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReactivate}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          {isEditing && (
            <Button
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Details */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="frequency">Email Frequency</Label>
                    <Select
                      value={editedSubscriber.preferences.frequency}
                      onValueChange={(value) =>
                        setEditedSubscriber(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            frequency: value as Newsletter['preferences']['frequency']
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={editedSubscriber.preferences.language}
                      onValueChange={(value) => setEditedSubscriber(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Email Frequency</p>
                    <Badge variant="outline">{subscriber.preferences.frequency}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Language</p>
                    <Badge variant="outline">{subscriber.preferences.language}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {editedSubscriber.preferences.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="flex items-center gap-1">
                        {category}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveCategory(category)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select onValueChange={handleAddCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Add category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travel-tips">Travel Tips</SelectItem>
                        <SelectItem value="destinations">Destinations</SelectItem>
                        <SelectItem value="deals">Deals & Offers</SelectItem>
                        <SelectItem value="news">Travel News</SelectItem>
                        <SelectItem value="reviews">Reviews</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subscriber.preferences.categories.length > 0 ? (
                    subscriber.preferences.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No categories selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {editedSubscriber.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subscriber.tags.length > 0 ? (
                    subscriber.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about this subscriber..."
                value={editedSubscriber.notes || ''}
                onChange={(e) => setEditedSubscriber(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                disabled={!isEditing}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Source */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={getStatusBadgeVariant(subscriber.status)}>
                  {subscriber.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Source</p>
                <Badge variant={getSourceBadgeVariant(subscriber.source)}>
                  {subscriber.source}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{subscriber.email}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(new Date(subscriber.subscribedAt), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">Subscribed</p>
                </div>
              </div>
              {subscriber.unsubscribedAt && (
                <div className="flex items-center gap-3">
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(subscriber.unsubscribedAt), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground">Unsubscribed</p>
                  </div>
                </div>
              )}
              {subscriber.lastEmailSent && (
                <div className="flex items-center gap-3">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(subscriber.lastEmailSent), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Email Sent</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Email Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Emails Sent</p>
                <p className="text-2xl font-bold">{subscriber.emailCount}</p>
              </div>
              {subscriber.bounceCount > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-600">Bounces</p>
                  <p className="text-lg font-semibold text-orange-600">{subscriber.bounceCount}</p>
                </div>
              )}
              {subscriber.complaintCount > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600">Complaints</p>
                  <p className="text-lg font-semibold text-red-600">{subscriber.complaintCount}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Details */}
          {subscriber.metadata.ip && (
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">IP Address</p>
                  <p className="text-sm text-muted-foreground font-mono">{subscriber.metadata.ip}</p>
                </div>
                {subscriber.metadata.userAgent && (
                  <div>
                    <p className="text-sm font-medium">User Agent</p>
                    <p className="text-sm text-muted-foreground break-all">{subscriber.metadata.userAgent}</p>
                  </div>
                )}
                {subscriber.metadata.referrer && (
                  <div>
                    <p className="text-sm font-medium">Referrer</p>
                    <p className="text-sm text-muted-foreground break-all">{subscriber.metadata.referrer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* UTM Parameters */}
          {(subscriber.metadata.utm_source || subscriber.metadata.utm_medium || subscriber.metadata.utm_campaign) && (
            <Card>
              <CardHeader>
                <CardTitle>UTM Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {subscriber.metadata.utm_source && (
                  <div>
                    <p className="text-sm font-medium">Source</p>
                    <p className="text-sm text-muted-foreground">{subscriber.metadata.utm_source}</p>
                  </div>
                )}
                {subscriber.metadata.utm_medium && (
                  <div>
                    <p className="text-sm font-medium">Medium</p>
                    <p className="text-sm text-muted-foreground">{subscriber.metadata.utm_medium}</p>
                  </div>
                )}
                {subscriber.metadata.utm_campaign && (
                  <div>
                    <p className="text-sm font-medium">Campaign</p>
                    <p className="text-sm text-muted-foreground">{subscriber.metadata.utm_campaign}</p>
                  </div>
                )}
                {subscriber.metadata.utm_term && (
                  <div>
                    <p className="text-sm font-medium">Term</p>
                    <p className="text-sm text-muted-foreground">{subscriber.metadata.utm_term}</p>
                  </div>
                )}
                {subscriber.metadata.utm_content && (
                  <div>
                    <p className="text-sm font-medium">Content</p>
                    <p className="text-sm text-muted-foreground">{subscriber.metadata.utm_content}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
