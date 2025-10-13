import {
  LayoutGrid,
  FileText,
  MessageSquare,
  Users,
  BarChart,
  Settings,
  Eye,
  Calendar,
  Download,
  Shield,
  Mail,
  UserCheck,
  FolderTree,
} from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Admin Panel',
    icon: FileText,
    children: [
      { title: 'Dashboard', path: '/layout-1/blog/dashboard' },
      {
        title: 'Content Management',
        children: [
          { title: 'Published & Review Posts', path: '/layout-1/blog/posts' },
          { title: 'New Post', path: '/layout-1/blog/posts/new' },
          { title: 'Draft Posts', path: '/layout-1/blog/posts/drafts' },
          { title: 'Scheduled Posts', path: '/layout-1/blog/posts/scheduled' },
          { title: 'Categories', path: '/layout-1/blog/categories', icon: FolderTree },
        ],
      },
      {
        title: 'User Management',
        children: [
          { title: 'Role Management', path: '/layout-1/blog/users/roles' },
        ],
      },
      {
        title: 'Moderation',
        children: [
          { title: 'Comment Moderation', path: '/layout-1/blog/comments' },
        ],
      },
      {
        title: 'Analytics & Reports',
        children: [
          { title: 'Report Download', path: '/layout-1/blog/reports' },
          { title: 'Subscriber Metrics', path: '/layout-1/blog/subscribers' },
        ],
      },
      {
        title: 'Contact Management',
        children: [
          { title: 'Contact Submissions', path: '/layout-1/blog/contacts', icon: MessageSquare },
        ],
      },
      {
        title: 'Newsletter Management',
        children: [
          { title: 'Newsletter Subscribers', path: '/layout-1/blog/newsletter', icon: Mail },
        ],
      },
    ],
  },
];

export const MENU_MEGA: MenuConfig = [
  { title: 'Home', path: '/layout-1' },
  {
    title: 'Admin Panel',
    children: [
      {
        title: 'Content',
        children: [
          { title: 'Published & Review Posts', path: '/layout-1/blog/posts' },
          { title: 'New Post', path: '/layout-1/blog/posts/new' },
          { title: 'Draft Posts', path: '/layout-1/blog/posts/drafts' },
          { title: 'Scheduled Posts', path: '/layout-1/blog/posts/scheduled' },
        ],
      },
      {
        title: 'Management',
        children: [
          { title: 'Dashboard', path: '/layout-1/blog/dashboard' },
          { title: 'Comment Moderation', path: '/layout-1/blog/comments' },
          { title: 'Contact Submissions', path: '/layout-1/blog/contacts' },
          { title: 'Newsletter Subscribers', path: '/layout-1/blog/newsletter' },
          { title: 'Report Download', path: '/layout-1/blog/reports' },
          { title: 'Subscriber Metrics', path: '/layout-1/blog/subscribers' },
        ],
      },
      {
        title: 'Users',
        children: [
          { title: 'Role Management', path: '/layout-1/blog/users/roles' },
        ],
      },
    ],
  },
];

export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Home', path: '/layout-1' },
  {
    title: 'Admin Panel',
    children: [
      {
        title: 'Content',
        children: [
          { title: 'Published & Review Posts', path: '/layout-1/blog/posts' },
          { title: 'New Post', path: '/layout-1/blog/posts/new' },
          { title: 'Draft Posts', path: '/layout-1/blog/posts/drafts' },
          { title: 'Scheduled Posts', path: '/layout-1/blog/posts/scheduled' },
        ],
      },
      {
        title: 'Management',
        children: [
          { title: 'Dashboard', path: '/layout-1/blog/dashboard' },
          { title: 'Comment Moderation', path: '/layout-1/blog/comments' },
          { title: 'Contact Submissions', path: '/layout-1/blog/contacts' },
          { title: 'Newsletter Subscribers', path: '/layout-1/blog/newsletter' },
          { title: 'Report Download', path: '/layout-1/blog/reports' },
          { title: 'Subscriber Metrics', path: '/layout-1/blog/subscribers' },
        ],
      },
      {
        title: 'Users',
        children: [
          { title: 'Role Management', path: '/layout-1/blog/users/roles' },
        ],
      },
    ],
  },
];