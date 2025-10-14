import { NextResponse } from 'next/server';
import { getSessionRole, can } from '@/lib/rbac';

// GET /api/admin/stats - Get dashboard statistics
export async function GET() {
  try {
    const role = getSessionRole();
    
    if (!can(role, 'stats:view')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Mock data for now - in production, this would fetch from the backend API
    const stats = {
      contacts: {
        total: 156,
        today: 3,
        thisWeek: 12,
        thisMonth: 45,
        byStatus: {
          new: 23,
          read: 45,
          replied: 67,
          archived: 21
        },
        byPriority: {
          low: 34,
          medium: 78,
          high: 32,
          urgent: 12
        },
        recent: [
          {
            _id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            subject: 'Travel inquiry',
            status: 'new',
            priority: 'medium',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            subject: 'Booking question',
            status: 'read',
            priority: 'high',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      },
      newsletters: {
        total: 1247,
        today: 8,
        thisWeek: 34,
        thisMonth: 156,
        byStatus: {
          active: 1156,
          unsubscribed: 67,
          bounced: 18,
          complained: 6
        },
        byFrequency: {
          weekly: 234,
          monthly: 856,
          quarterly: 157
        },
        bySource: {
          website: 678,
          popup: 234,
          footer: 189,
          admin: 45,
          import: 101
        },
        recent: [
          {
            _id: '1',
            email: 'newuser@example.com',
            status: 'active',
            source: 'website',
            preferences: {
              frequency: 'monthly'
            },
            subscribedAt: new Date().toISOString()
          },
          {
            _id: '2',
            email: 'traveler@example.com',
            status: 'active',
            source: 'popup',
            preferences: {
              frequency: 'weekly'
            },
            subscribedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
