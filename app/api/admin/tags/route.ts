import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.ADMIN_BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '20';

    // Default common tags to provide suggestions even when backend is unavailable
    const defaultTags = [
      'travel', 'destinations', 'tips', 'guide', 'adventure', 'culture', 'food', 'photography',
      'budget', 'luxury', 'family', 'solo', 'backpacking', 'hiking', 'beach', 'mountains',
      'city', 'nature', 'wildlife', 'history', 'art', 'music', 'festival', 'shopping',
      'accommodation', 'transport', 'safety', 'planning', 'itinerary', 'reviews', 'recommendations'
    ];

    const allTags = new Set<string>();

    try {
      // Try to fetch tags from simple posts
      const simplePostsResponse = await fetch(`${API_BASE_URL}/api/v1/simple-posts?limit=1000`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (simplePostsResponse.ok) {
        const simplePostsData = await simplePostsResponse.json();
        if (simplePostsData.success && simplePostsData.data) {
          simplePostsData.data.forEach((post: { tags?: string[] }) => {
            if (post.tags && Array.isArray(post.tags)) {
              post.tags.forEach((tag: string) => {
                if (tag && tag.trim()) {
                  allTags.add(tag.trim().toLowerCase());
                }
              });
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch simple posts tags:', error);
    }

    try {
      // Try to fetch tags from regular posts
      const postsResponse = await fetch(`${API_BASE_URL}/api/v1/posts?limit=1000`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        if (postsData.success && postsData.data) {
          postsData.data.forEach((post: { tags?: string[] }) => {
            if (post.tags && Array.isArray(post.tags)) {
              post.tags.forEach((tag: string) => {
                if (tag && tag.trim()) {
                  allTags.add(tag.trim().toLowerCase());
                }
              });
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch regular posts tags:', error);
    }

    // If no tags were fetched from backend, use default tags
    if (allTags.size === 0) {
      defaultTags.forEach(tag => allTags.add(tag));
    }

    // Convert to array and filter by search term
    let tagsArray = Array.from(allTags).sort();
    
    if (search) {
      tagsArray = tagsArray.filter(tag => 
        tag.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Limit results
    tagsArray = tagsArray.slice(0, parseInt(limit));

    return NextResponse.json({
      success: true,
      data: tagsArray,
      total: tagsArray.length,
      source: allTags.size > 0 ? 'database' : 'default'
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    
    // Return default tags as fallback
    const defaultTags = [
      'travel', 'destinations', 'tips', 'guide', 'adventure', 'culture', 'food', 'photography',
      'budget', 'luxury', 'family', 'solo', 'backpacking', 'hiking', 'beach', 'mountains'
    ];
    
    let filteredTags = defaultTags;
    const search = new URL(request.url).searchParams.get('search') || '';
    if (search) {
      filteredTags = defaultTags.filter(tag => 
        tag.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredTags.slice(0, parseInt(new URL(request.url).searchParams.get('limit') || '20')),
      total: filteredTags.length,
      source: 'fallback'
    });
  }
}
