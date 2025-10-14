'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Edit,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Users,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getUsers, updateUserRole, User, UserSearch } from '@/lib/api-client';

/**
 * Main component for managing user roles and permissions in the blog admin panel.
 * Provides functionality to view, search, filter, and change user roles.
 */
export default function RoleManagementPage() {
  // State for search functionality - stores the current search term
  const [searchTerm, setSearchTerm] = useState('');
  // State for role filtering - stores the selected role filter ('all', 'admin', 'editor', 'contributor')
  const [roleFilter, setRoleFilter] = useState('all');
  // State for users data from API
  const [users, setUsers] = useState<User[]>([]);
  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  // State for error handling
  const [error, setError] = useState<string | null>(null);
  // State for pagination
  const [, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    count: 0
  });
  // State for the user selected for role change - stores complete user object or null
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // State for controlling the role change dialog visibility
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  // State for the new role selected in the change role dialog
  const [newRole, setNewRole] = useState('');
  // State for role update loading
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  // Hook for displaying toast notifications
  const { toast } = useToast();

  // Function to retry fetching users
  const retryFetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const searchParams: UserSearch = {
        search: searchTerm || undefined,
        role: roleFilter as 'all' | 'admin' | 'editor' | 'contributor',
        status: 'all',
        page: 1,
        limit: 50
      };

      const response = await getUsers(searchParams);
      setUsers(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        pages: response.pages,
        count: response.count
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, toast]);

  // Load users on component mount and when filters change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const searchParams: UserSearch = {
          search: searchTerm || undefined,
          role: roleFilter as 'all' | 'admin' | 'editor' | 'contributor',
          status: 'all',
          page: 1,
          limit: 50
        };

        const response = await getUsers(searchParams);
        setUsers(response.data);
        setPagination({
          total: response.total,
          page: response.page,
          pages: response.pages,
          count: response.count
        });
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, roleFilter, toast]);

  const roles = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access and administration', color: 'bg-purple-100 text-purple-800' },
    { value: 'admin', label: 'Admin', description: 'Full access to all features', color: 'bg-red-100 text-red-800' },
    { value: 'editor', label: 'Editor', description: 'Can create, edit, and publish content', color: 'bg-blue-100 text-blue-800' },
    { value: 'contributor', label: 'Contributor', description: 'Can create and edit own content', color: 'bg-green-100 text-green-800' },
  ];

  const permissions = {
    super_admin: ['Create Posts', 'Edit All Posts', 'Delete Posts', 'Moderate Comments', 'Manage Users', 'View Analytics', 'Export Reports', 'System Administration', 'Database Management'],
    admin: ['Create Posts', 'Edit All Posts', 'Delete Posts', 'Moderate Comments', 'Manage Users', 'View Analytics', 'Export Reports'],
    editor: ['Create Posts', 'Edit All Posts', 'Moderate Comments', 'View Analytics'],
    contributor: ['Create Posts', 'Edit Own Posts', 'View Own Analytics'],
  };

  /**
   * Creates a styled badge component for displaying user roles with appropriate colors.
   * @param role - The role string (admin, editor, contributor)
   * @returns JSX Badge component with role-specific styling
   */
  const getRoleBadge = (role: string) => {
    const roleData = roles.find(r => r.value === role);
    return (
      <Badge className={roleData?.color || 'bg-gray-100 text-gray-800'}>
        {roleData?.label || role}
      </Badge>
    );
  };

  /**
   * Creates a styled badge component for displaying user status with appropriate colors.
   * @param status - The user status string (active, inactive)
   * @returns JSX Badge component with status-specific styling
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  /**
   * Formats a date string to a user-friendly format
   * @param dateString - The date string to format
   * @returns Formatted date string (e.g., "Oct 12, 2025")
   */
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Never';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  /**
   * Formats a date string to a relative time format
   * @param dateString - The date string to format
   * @returns Relative time string (e.g., "2 days ago", "1 week ago")
   */
  const formatRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Never';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return 'Today';
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      } else {
        const years = Math.floor(diffInDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
      }
    } catch {
      return 'Unknown';
    }
  };

  // Users are already filtered by the API, so we can use them directly
  const filteredUsers = users;

  /**
   * Handles opening the role change dialog for a specific user.
   * Sets the selected user, initializes the new role with current role, and opens the dialog.
   * @param user - The user object whose role will be changed
   */
  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsChangeRoleOpen(true);
  };

  /**
   * Handles saving the role change for the selected user.
   * Validates that at least one admin remains in the system before allowing admin downgrade.
   * Calls the API to update the user role and shows appropriate toast notifications.
   * Closes the dialog and resets state on successful update.
   */
  const handleSaveRole = async () => {
    if (!selectedUser || !newRole) return;

    // Validate role change - prevent removing the last admin
    if (selectedUser.role === 'admin' && newRole !== 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        toast({
          title: "Cannot downgrade last admin",
          description: "At least one admin must remain in the system.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsUpdatingRole(true);
      
      // Call API to update user role
      const updatedUser = await updateUserRole(selectedUser._id, newRole);
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id ? updatedUser : user
        )
      );
      
      toast({
        title: "Role updated",
        description: `${selectedUser.name}'s role has been updated to ${newRole}.`,
      });
      
      // Close dialog and reset state
      setIsChangeRoleOpen(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-6 ml-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Manage RBAC for Admin / Editor / Contributor
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-red-600">
                      <p>{error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={retryFetchUsers}
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2" />
                      <p>No users found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name || user.email || 'User'} />
                        <AvatarFallback>{(user.name || user.email || 'U').split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name || user.email || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm">
                      <Activity className="h-3 w-3" />
                      <div className="flex flex-col">
                        <span>{formatDate(user.lastActive)}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(user.lastActive)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-3 w-3" />
                      <div className="flex flex-col">
                        <span>{formatDate(user.joinDate)}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(user.joinDate)}</span>
                      </div>
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
                        <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Select New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={role.color}>{role.label}</Badge>
                        <span className="text-sm text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newRole && (
              <div>
                <Label>Permissions Preview</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">This role can:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {permissions[newRole as keyof typeof permissions]?.map((permission, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedUser?.role === 'admin' && newRole !== 'admin' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Admin Downgrade Warning</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This user currently has admin privileges. Make sure at least one admin remains in the system.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsChangeRoleOpen(false)}
              disabled={isUpdatingRole}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRole} 
              disabled={!newRole || newRole === selectedUser?.role || isUpdatingRole}
            >
              {isUpdatingRole ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
