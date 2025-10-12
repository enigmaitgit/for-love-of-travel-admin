'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  Activity, 
  Shield, 
  Clock,
  MapPin,
  Phone,
  Globe
} from 'lucide-react';

interface ViewProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatar?: string;
    lastActive: string;
    joinDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  contributor: 'bg-green-100 text-green-800',
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

const permissions = {
  admin: ['Create Posts', 'Edit All Posts', 'Delete Posts', 'Moderate Comments', 'Manage Users', 'View Analytics', 'Export Reports'],
  editor: ['Create Posts', 'Edit All Posts', 'Moderate Comments', 'View Analytics'],
  contributor: ['Create Posts', 'Edit Own Posts', 'View Own Analytics'],
};

export default function ViewProfileDialog({ open, onOpenChange, user }: ViewProfileDialogProps) {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Profile</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about {user.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <Badge className={roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <Badge className={statusColors[user.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Role</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge className={roleColors[user.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge className={statusColors[user.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Join Date</div>
                    <div className="text-sm text-muted-foreground">{formatDate(user.joinDate)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Last Active</div>
                    <div className="text-sm text-muted-foreground">{user.lastActive}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Account Created</div>
                    <div className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Last Updated</div>
                    <div className="text-sm text-muted-foreground">{formatDate(user.updatedAt)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {permissions[user.role as keyof typeof permissions]?.map((permission, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{permission}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
