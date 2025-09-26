'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Mail, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  UserX,
  UserCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle
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

type NewsletterBulkAction = 'changeStatus' | 'unsubscribe' | 'delete';

type NewsletterBulkActionData = { status: Newsletter['status'] };

interface NewsletterTableProps {
  subscribers: Newsletter[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSubscriberSelect: (subscriber: Newsletter) => void;
  onBulkAction: (
    action: NewsletterBulkAction,
    subscriberIds: string[],
    data?: NewsletterBulkActionData
  ) => void;
  loading?: boolean;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'complained', label: 'Complained' },
];

const frequencyOptions = [
  { value: 'all', label: 'All Frequency' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const sourceOptions = [
  { value: 'all', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'popup', label: 'Popup' },
  { value: 'footer', label: 'Footer' },
  { value: 'admin', label: 'Admin' },
  { value: 'import', label: 'Import' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'unsubscribed':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    case 'bounced':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'complained':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
  }
};

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

export function NewsletterTable({
  subscribers,
  total,
  page,
  limit,
  onPageChange,
  onSubscriberSelect,
  onBulkAction,
  loading = false
}: NewsletterTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscribers(subscribers.map(subscriber => subscriber._id));
    } else {
      setSelectedSubscribers([]);
    }
    setSelectAll(checked);
  };

  const handleSelectSubscriber = (subscriberId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscribers(prev => [...prev, subscriberId]);
    } else {
      setSelectedSubscribers(prev => prev.filter(id => id !== subscriberId));
    }
  };

  const handleBulkStatusChange = (status: Newsletter['status']) => {
    onBulkAction('changeStatus', selectedSubscribers, { status });
    setSelectedSubscribers([]);
    setSelectAll(false);
  };

  const handleBulkUnsubscribe = () => {
    onBulkAction('unsubscribe', selectedSubscribers);
    setSelectedSubscribers([]);
    setSelectAll(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedSubscribers.length} subscribers?`)) {
      onBulkAction('delete', selectedSubscribers);
      setSelectedSubscribers([]);
      setSelectAll(false);
    }
  };

  useEffect(() => {
    setSelectAll(selectedSubscribers.length === subscribers.length && subscribers.length > 0);
  }, [selectedSubscribers, subscribers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter Subscribers</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <SearchBar
            placeholder="Search subscribers..."
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
            label="All Frequency"
            value={frequencyFilter}
            options={frequencyOptions}
            onChange={setFrequencyFilter}
          />
          <FilterDropdown
            label="All Sources"
            value={sourceFilter}
            options={sourceOptions}
            onChange={setSourceFilter}
          />
        </div>
        
        {selectedSubscribers.length > 0 && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedSubscribers.length} selected
            </span>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUnsubscribe()}>
                    <UserX className="h-4 w-4 mr-2" />
                    Unsubscribe
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('bounced')}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark as Bounced
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
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Emails Sent</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading subscribers...
                  </TableCell>
                </TableRow>
              ) : subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No subscribers found
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((subscriber) => (
                  <TableRow
                    key={subscriber._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSubscriberSelect(subscriber)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedSubscribers.includes(subscriber._id)}
                        onCheckedChange={(checked) => 
                          handleSelectSubscriber(subscriber._id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{subscriber.email}</div>
                        {subscriber.tags.length > 0 && (
                          <div className="flex gap-1">
                            {subscriber.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {subscriber.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{subscriber.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(subscriber.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(subscriber.status)}
                          {subscriber.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subscriber.preferences.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSourceBadgeVariant(subscriber.source)}>
                        {subscriber.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(subscriber.subscribedAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {subscriber.emailCount}
                        {subscriber.bounceCount > 0 && (
                          <span className="text-orange-500 ml-1">
                            ({subscriber.bounceCount} bounced)
                          </span>
                        )}
                        {subscriber.complaintCount > 0 && (
                          <span className="text-red-500 ml-1">
                            ({subscriber.complaintCount} complaints)
                          </span>
                        )}
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
                          <DropdownMenuItem onClick={() => onSubscriberSelect(subscriber)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {subscriber.status === 'active' && (
                            <DropdownMenuItem onClick={() => onBulkAction('unsubscribe', [subscriber._id])}>
                              <UserX className="h-4 w-4 mr-2" />
                              Unsubscribe
                            </DropdownMenuItem>
                          )}
                          {subscriber.status === 'unsubscribed' && (
                            <DropdownMenuItem onClick={() => onBulkAction('changeStatus', [subscriber._id], { status: 'active' })}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
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
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} subscribers
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
