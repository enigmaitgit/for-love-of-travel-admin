'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NewsletterDetail } from '@/components/admin/NewsletterDetail';
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

export default function NewsletterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const email = decodeURIComponent(params.email as string);
  
  const [subscriber, setSubscriber] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriber = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/newsletter/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscriber(data.data);
      } else {
        toast.error('Failed to fetch subscriber');
        router.push('/layout-1/blog/newsletter');
      }
    } catch (error) {
      console.error('Error fetching subscriber:', error);
      toast.error('Failed to fetch subscriber');
      router.push('/layout-1/blog/newsletter');
    } finally {
      setLoading(false);
    }
  }, [email, router]);

  useEffect(() => {
    if (email) {
      fetchSubscriber();
    }
  }, [email, fetchSubscriber]);

  const handleUpdate = async (email: string, updates: Partial<Newsletter>) => {
    try {
      const response = await fetch(`/api/admin/newsletter/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subscriber updated successfully');
        setSubscriber(data.data);
      } else {
        toast.error('Failed to update subscriber');
      }
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast.error('Failed to update subscriber');
    }
  };

  const handleDelete = async (email: string) => {
    try {
      const response = await fetch(`/api/admin/newsletter/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subscriber deleted successfully');
        router.push('/layout-1/blog/newsletter');
      } else {
        toast.error('Failed to delete subscriber');
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Failed to delete subscriber');
    }
  };

  const handleBack = () => {
    router.push('/layout-1/blog/newsletter');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading subscriber details...</p>
        </div>
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Subscriber not found</p>
          <button 
            onClick={handleBack}
            className="text-primary hover:underline mt-2"
          >
            Back to newsletter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <NewsletterDetail
        subscriber={subscriber}
        onBack={handleBack}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}


