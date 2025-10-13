'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewsletterTable } from '@/components/admin/NewsletterTable';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
}

export default function NewsletterPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchSubscribers();
  }, [page, fetchSubscribers]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/newsletter?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.data.rows);
        setTotal(data.data.total);
      } else {
        toast.error('Failed to fetch subscribers');
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriberSelect = (subscriber: Newsletter) => {
    router.push(`/layout-1/blog/newsletter/${encodeURIComponent(subscriber.email)}`);
  };

  const handleBulkAction = async (action: string, subscriberIds: string[], data?: { status?: string }) => {
    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          newsletterIds: subscriberIds,
          ...data
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchSubscribers(); // Refresh the list
      } else {
        toast.error('Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleRefresh = () => {
    fetchSubscribers();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
          <p className="text-muted-foreground">
            Manage newsletter subscriptions and preferences
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <NewsletterTable
        subscribers={subscribers}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onSubscriberSelect={handleSubscriberSelect}
        onBulkAction={handleBulkAction}
        loading={loading}
      />
    </div>
  );
}
