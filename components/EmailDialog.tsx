'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

const emailTemplates = {
  welcome: {
    subject: 'Welcome to the Admin Panel',
    body: `Hello {name},

Welcome to our admin panel! We're excited to have you join our team.

Your account has been set up with {role} permissions. You can now access the admin panel and start managing content.

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Best regards,
Admin Team`
  },
  roleChange: {
    subject: 'Your Role Has Been Updated',
    body: `Hello {name},

Your role in the admin panel has been updated to {role}. This change affects your permissions and access levels.

Please log in to see your updated permissions and familiarize yourself with any new features available to you.

If you have any questions about your new role or need training on specific features, please contact our support team.

Best regards,
Admin Team`
  },
  reminder: {
    subject: 'Profile Update Reminder',
    body: `Hello {name},

This is a friendly reminder to complete your profile setup in the admin panel. Having an up-to-date profile helps us provide better support and ensures you receive relevant notifications.

Please take a moment to:
- Update your profile information
- Add a profile picture
- Review your notification preferences

Thank you for your attention to this matter.

Best regards,
Admin Team`
  },
  custom: {
    subject: '',
    body: ''
  }
};

export default function EmailDialog({ open, onOpenChange, user }: EmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && open) {
      setSelectedTemplate('welcome');
      const template = emailTemplates.welcome;
      setSubject(template.subject);
      setBody(template.body.replace('{name}', user.name).replace('{role}', user.role));
    }
  }, [user, open]);

  useEffect(() => {
    if (selectedTemplate !== 'custom' && user) {
      const template = emailTemplates[selectedTemplate as keyof typeof emailTemplates];
      setSubject(template.subject);
      setBody(template.body.replace('{name}', user.name).replace('{role}', user.role));
    }
  }, [selectedTemplate, user]);

  const handleSend = async () => {
    if (!user || !subject.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and body",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call - replace with actual email sending logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Email sent successfully",
        description: `Email has been sent to ${user.email}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Send Email</span>
          </DialogTitle>
          <DialogDescription>
            Send an email to <span className="font-medium">{user.name}</span> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Template Selection */}
          <div>
            <Label htmlFor="template">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Welcome Email</SelectItem>
                <SelectItem value="roleChange">Role Change Notification</SelectItem>
                <SelectItem value="reminder">Profile Reminder</SelectItem>
                <SelectItem value="custom">Custom Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject Field */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              disabled={isLoading}
            />
          </div>

          {/* Body Field */}
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message"
              rows={8}
              disabled={isLoading}
            />
          </div>

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !subject.trim() || !body.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
