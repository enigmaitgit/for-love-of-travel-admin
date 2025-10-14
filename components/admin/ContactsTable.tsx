'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Mail, 
  Phone, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  Reply, 
  Archive,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { cn } from '@/lib/utils';

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

interface ContactsTableProps {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onContactSelect: (contact: Contact) => void;
  onBulkAction: (action: string, contactIds: string[], data?: { status?: string; priority?: string }) => void;
  loading?: boolean;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

const priorityOptions = [
  { value: 'all', label: 'All Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'new':
      return <Circle className="h-4 w-4 text-blue-500" />;
    case 'read':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'replied':
      return <Reply className="h-4 w-4 text-purple-500" />;
    case 'archived':
      return <Archive className="h-4 w-4 text-gray-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'low':
      return <AlertCircle className="h-4 w-4 text-green-500" />;
    case 'medium':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'urgent':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'new':
      return 'primary';
    case 'read':
      return 'secondary';
    case 'replied':
      return 'outline';
    case 'archived':
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

export function ContactsTable({
  contacts,
  total,
  page,
  limit,
  onPageChange,
  onContactSelect,
  onBulkAction,
  loading = false
}: ContactsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const contactsArray = Array.isArray(contacts) ? contacts : [];
      setSelectedContacts(contactsArray.map(contact => contact._id));
    } else {
      setSelectedContacts([]);
    }
    setSelectAll(checked);
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleBulkStatusChange = (status: string) => {
    onBulkAction('changeStatus', selectedContacts, { status });
    setSelectedContacts([]);
    setSelectAll(false);
  };

  const handleBulkPriorityChange = (priority: string) => {
    onBulkAction('changePriority', selectedContacts, { priority });
    setSelectedContacts([]);
    setSelectAll(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
      onBulkAction('delete', selectedContacts);
      setSelectedContacts([]);
      setSelectAll(false);
    }
  };

  useEffect(() => {
    const contactsArray = Array.isArray(contacts) ? contacts : [];
    setSelectAll(selectedContacts.length === contactsArray.length && contactsArray.length > 0);
  }, [selectedContacts, contacts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Submissions</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <SearchBar
            placeholder="Search contacts..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <FilterDropdown
            label="All Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="All Priority"
            value={priorityFilter}
            options={priorityOptions}
            onChange={setPriorityFilter}
          />
        </div>
        
        {selectedContacts.length > 0 && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedContacts.length} selected
            </span>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('read')}>
                    Mark as Read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('replied')}>
                    Mark as Replied
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('archived')}>
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change Priority
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange('low')}>
                    Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange('medium')}>
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange('high')}>
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkPriorityChange('urgent')}>
                    Urgent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading contacts...
                  </TableCell>
                </TableRow>
              ) : !contacts || !Array.isArray(contacts) || contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No contacts found
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow
                    key={contact._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onContactSelect(contact)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedContacts.includes(contact._id)}
                        onCheckedChange={(checked) => 
                          handleSelectContact(contact._id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {contact.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(contact.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(contact.status)}
                          {contact.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(contact.priority)}>
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(contact.priority)}
                          {contact.priority}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(contact.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onContactSelect(contact)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => window.open(`mailto:${contact.email}?subject=Re: ${contact.subject}`)}
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} contacts
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


