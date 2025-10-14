'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Mail, 
  Calendar, 
  User, 
  MessageSquare, 
  ArrowLeft,
  Reply,
  Archive,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
// import { cn } from '@/lib/utils';

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

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onUpdate: (contactId: string, updates: Partial<Contact>) => void;
  onDelete: (contactId: string) => void;
}

// const getStatusBadgeVariant = (status: string) => {
//   switch (status) {
//     case 'new':
//       return 'default';
//     case 'read':
//       return 'secondary';
//     case 'replied':
//       return 'outline';
//     case 'archived':
//       return 'destructive';
//     default:
//       return 'default';
//   }
// };

// const getPriorityBadgeVariant = (priority: string) => {
//   switch (priority) {
//     case 'low':
//       return 'secondary';
//     case 'medium':
//       return 'default';
//     case 'high':
//       return 'destructive';
//     case 'urgent':
//       return 'destructive';
//     default:
//       return 'default';
//   }
// };

export function ContactDetail({
  contact,
  onBack,
  onUpdate,
  onDelete
}: ContactDetailProps) {
  // const [isEditing, setIsEditing] = useState(false);
  const [, setEditedContact] = useState(contact);
  const [notes, setNotes] = useState('');

  // const handleSave = () => {
  //   onUpdate(contact._id, editedContact);
  //   setIsEditing(false);
  // };

  // const handleCancel = () => {
  //   setEditedContact(contact);
  //   setIsEditing(false);
  // };

  const handleStatusChange = (status: string) => {
    const updates = { status: status as Contact['status'] };
    onUpdate(contact._id, updates);
  };

  const handlePriorityChange = (priority: string) => {
    const updates = { priority: priority as Contact['priority'] };
    onUpdate(contact._id, updates);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      onDelete(contact._id);
    }
  };

  const handleReply = () => {
    window.open(`mailto:${contact.email}?subject=Re: ${contact.subject}`);
    handleStatusChange('replied');
  };

  const handleArchive = () => {
    handleStatusChange('archived');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <p className="text-muted-foreground">{contact.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReply}
            disabled={contact.status === 'replied'}
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={contact.status === 'archived'}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
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
          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{contact.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(contact.createdAt), 'PPP p')}
                  </p>
                </div>
                <Separator />
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{contact.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about this contact..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={contact.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={contact.priority}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">Name</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{contact.email}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(new Date(contact.createdAt), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">IP Address</p>
                <p className="text-sm text-muted-foreground font-mono">{contact.ip}</p>
              </div>
              <div>
                <p className="text-sm font-medium">User Agent</p>
                <p className="text-sm text-muted-foreground break-all">{contact.userAgent}</p>
              </div>
              {contact.metadata.referrer && (
                <div>
                  <p className="text-sm font-medium">Referrer</p>
                  <p className="text-sm text-muted-foreground break-all">{contact.metadata.referrer}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Source</p>
                <p className="text-sm text-muted-foreground">{contact.metadata.source}</p>
              </div>
            </CardContent>
          </Card>

          {/* UTM Parameters */}
          {(contact.metadata.utm_source || contact.metadata.utm_medium || contact.metadata.campaign) && (
            <Card>
              <CardHeader>
                <CardTitle>UTM Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.metadata.utm_source && (
                  <div>
                    <p className="text-sm font-medium">Source</p>
                    <p className="text-sm text-muted-foreground">{contact.metadata.utm_source}</p>
                  </div>
                )}
                {contact.metadata.utm_medium && (
                  <div>
                    <p className="text-sm font-medium">Medium</p>
                    <p className="text-sm text-muted-foreground">{contact.metadata.utm_medium}</p>
                  </div>
                )}
                {contact.metadata.campaign && (
                  <div>
                    <p className="text-sm font-medium">Campaign</p>
                    <p className="text-sm text-muted-foreground">{contact.metadata.campaign}</p>
                  </div>
                )}
                {contact.metadata.utm_term && (
                  <div>
                    <p className="text-sm font-medium">Term</p>
                    <p className="text-sm text-muted-foreground">{contact.metadata.utm_term}</p>
                  </div>
                )}
                {contact.metadata.utm_content && (
                  <div>
                    <p className="text-sm font-medium">Content</p>
                    <p className="text-sm text-muted-foreground">{contact.metadata.utm_content}</p>
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


