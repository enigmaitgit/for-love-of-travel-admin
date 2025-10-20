import { useState, useEffect } from 'react';

export interface AnalyticsData {
  overview: {
    totalViews: number;
    totalPosts: number;
    totalComments: number;
    totalUsers: number;
    viewsChange: number;
    postsChange: number;
    commentsChange: number;
    usersChange: number;
  };
  recentMetrics: {
    newPosts24h: number;
    newPosts7d: number;
    pendingReviews: number;
    commentsInQueue: number;
    newSubscribers24h: number;
    newSubscribers7d: number;
    adFillRate: number;
    revenue: number;
    ctr: number;
  };
  monthlyViews: Array<{
    month: string;
    views: number;
    posts: number;
    comments: number;
  }>;
  topPosts: Array<{
    title: string;
    views: number;
    comments: number;
    rating: number;
  }>;
  trafficSources: Array<{
    source: string;
    percentage: number;
    visitors: number;
  }>;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
  error?: string;
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching analytics data...');
      const response = await fetch('/api/admin/analytics');
      const data: AnalyticsResponse = await response.json();

      console.log('Analytics API response:', { status: response.status, success: data.success });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      if (data.success) {
        console.log('Analytics data loaded successfully:', data.data);
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      
      // Fallback to mock data if API fails
      setAnalytics({
        overview: {
          totalViews: 125000,
          totalPosts: 45,
          totalComments: 234,
          totalUsers: 1200,
          viewsChange: 12.5,
          postsChange: 8.2,
          commentsChange: -3.1,
          usersChange: 15.7
        },
        recentMetrics: {
          newPosts24h: 3,
          newPosts7d: 12,
          pendingReviews: 8,
          commentsInQueue: 15,
          newSubscribers24h: 45,
          newSubscribers7d: 280,
          adFillRate: 87.5,
          revenue: 2450,
          ctr: 3.2
        },
        monthlyViews: [
          { month: 'Jan', views: 12000, posts: 3, comments: 18 },
          { month: 'Feb', views: 15000, posts: 4, comments: 22 },
          { month: 'Mar', views: 18000, posts: 5, comments: 28 },
          { month: 'Apr', views: 22000, posts: 6, comments: 35 },
          { month: 'May', views: 25000, posts: 7, comments: 42 },
          { month: 'Jun', views: 35000, posts: 8, comments: 58 },
          { month: 'Jul', views: 28000, posts: 6, comments: 45 },
          { month: 'Aug', views: 30000, posts: 7, comments: 52 },
          { month: 'Sep', views: 32000, posts: 8, comments: 48 },
          { month: 'Oct', views: 38000, posts: 9, comments: 65 },
          { month: 'Nov', views: 40000, posts: 10, comments: 72 },
          { month: 'Dec', views: 35000, posts: 8, comments: 58 },
        ],
        topPosts: [
          { title: 'Hidden Gems of Southeast Asia: 15 Secret Destinations', views: 15420, comments: 23, rating: 4.8 },
          { title: 'Solo Travel Safety Guide: Tips for Female Travelers', views: 12850, comments: 18, rating: 4.6 },
          { title: 'Budget Travel Hacks: How to See the World for Less', views: 11200, comments: 15, rating: 4.7 },
          { title: 'Best Time to Visit Europe: Seasonal Travel Guide', views: 9800, comments: 12, rating: 4.5 },
          { title: 'Backpacking Through Japan: Complete 2-Week Itinerary', views: 8750, comments: 10, rating: 4.9 }
        ],
        trafficSources: [
          { source: 'Organic Search', percentage: 45, visitors: 56250 },
          { source: 'Direct', percentage: 25, visitors: 31250 },
          { source: 'Social Media', percentage: 15, visitors: 18750 },
          { source: 'Referrals', percentage: 10, visitors: 12500 },
          { source: 'Email', percentage: 5, visitors: 6250 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const refresh = () => {
    fetchAnalytics();
  };

  return {
    analytics,
    loading,
    error,
    refresh
  };
}
