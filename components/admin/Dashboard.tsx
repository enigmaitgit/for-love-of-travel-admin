'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface DashboardStats {
  contacts: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    recent: Array<{
      _id: string;
      name: string;
      email: string;
      subject: string;
      status: string;
      priority: string;
      createdAt: string;
    }>;
  };
  newsletters: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
    byFrequency: Record<string, number>;
    bySource: Record<string, number>;
    recent: Array<{
      _id: string;
      email: string;
      status: string;
      source: string;
      preferences: {
        frequency: string;
      };
      subscribedAt: string;
    }>;
  };
}

interface DashboardProps {
  onNavigateToContacts: () => void;
  onNavigateToNewsletter: () => void;
}

export function Dashboard({ onNavigateToContacts, onNavigateToNewsletter }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
      case 'active':
        return 'primary';
      case 'read':
        return 'secondary';
      case 'replied':
        return 'outline';
      case 'archived':
      case 'unsubscribed':
        return 'destructive';
      case 'bounced':
      case 'complained':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'secondary';
      case 'medium':
        return 'primary';
      case 'high':
        return 'destructive';
      case 'urgent':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard statistics</p>
        <Button onClick={fetchStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Contacts"
          value={stats.contacts.total}
          description={`${stats.contacts.today} today`}
          icon={MessageSquare}
          trend={{
            value: Math.round((stats.contacts.thisWeek / Math.max(stats.contacts.total, 1)) * 100),
            label: 'this week',
            isPositive: true
          }}
        />
        <StatsCard
          title="Newsletter Subscribers"
          value={stats.newsletters.total}
          description={`${stats.newsletters.today} today`}
          icon={Mail}
          trend={{
            value: Math.round((stats.newsletters.thisWeek / Math.max(stats.newsletters.total, 1)) * 100),
            label: 'this week',
            isPositive: true
          }}
        />
        <StatsCard
          title="New Contacts This Month"
          value={stats.contacts.thisMonth}
          description="Contact submissions"
          icon={TrendingUp}
        />
        <StatsCard
          title="New Subscribers This Month"
          value={stats.newsletters.thisMonth}
          description="Newsletter signups"
          icon={UserPlus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.contacts.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {status}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onNavigateToContacts}
              >
                View All Contacts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Newsletter Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Newsletter Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.newsletters.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {status}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onNavigateToNewsletter}
              >
                View All Subscribers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.contacts.recent.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent contacts</p>
              ) : (
                stats.contacts.recent.map((contact) => (
                  <div key={contact._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {contact.subject}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusBadgeVariant(contact.status)}>
                        {contact.status}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(contact.priority)}>
                        {contact.priority}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(contact.createdAt), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onNavigateToContacts}
              >
                View All Contacts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Newsletter Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.newsletters.recent.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent subscribers</p>
              ) : (
                stats.newsletters.recent.map((subscriber) => (
                  <div key={subscriber._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{subscriber.email}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {subscriber.preferences.frequency}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {subscriber.source}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusBadgeVariant(subscriber.status)}>
                        {subscriber.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(subscriber.subscribedAt), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onNavigateToNewsletter}
              >
                View All Subscribers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Frequency & Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Newsletter Frequency Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.newsletters.byFrequency).map(([frequency, count]) => (
                <div key={frequency} className="flex items-center justify-between">
                  <span className="capitalize">{frequency}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Newsletter Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.newsletters.bySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="capitalize">{source}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


