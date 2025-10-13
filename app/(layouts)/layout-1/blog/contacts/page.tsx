'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContactsTable } from '@/components/admin/ContactsTable';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
  archivedAt?: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchContacts();
  }, [page, fetchContacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contacts?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.data.rows);
        setTotal(data.data.total);
      } else {
        toast.error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    router.push(`/layout-1/blog/contacts/${contact._id}`);
  };

  const handleBulkAction = async (action: string, contactIds: string[], data?: { status?: string; priority?: string }) => {
    try {
      const response = await fetch('/api/admin/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          contactIds,
          ...data
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchContacts(); // Refresh the list
      } else {
        toast.error('Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleRefresh = () => {
    fetchContacts();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
          <p className="text-muted-foreground">
            Manage and respond to contact form submissions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <ContactsTable
        contacts={contacts}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onContactSelect={handleContactSelect}
        onBulkAction={handleBulkAction}
        loading={loading}
      />
    </div>
  );
}
