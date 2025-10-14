'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ContactDetail } from '@/components/admin/ContactDetail';
import { toast } from 'sonner';

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ip: string;
  userAgent: string;
  metadata: {
    referrer?: string;
    source: string;
    campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_content?: string;
  };
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
  archivedAt?: string;
}

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContact = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contacts/${contactId}`);
      const data = await response.json();
      
      if (data.success) {
        setContact(data.data);
      } else {
        toast.error('Failed to fetch contact');
        router.push('/layout-1/blog/contacts');
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
      toast.error('Failed to fetch contact');
      router.push('/layout-1/blog/contacts');
    } finally {
      setLoading(false);
    }
  }, [contactId, router]);

  useEffect(() => {
    if (contactId) {
      fetchContact();
    }
  }, [contactId, fetchContact]);

  const handleUpdate = async (contactId: string, updates: Partial<Contact>) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Contact updated successfully');
        setContact(data.data);
      } else {
        toast.error('Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Contact deleted successfully');
        router.push('/layout-1/blog/contacts');
      } else {
        toast.error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const handleBack = () => {
    router.push('/layout-1/blog/contacts');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Contact not found</p>
          <button 
            onClick={handleBack}
            className="text-primary hover:underline mt-2"
          >
            Back to contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ContactDetail
        contact={contact}
        onBack={handleBack}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}


