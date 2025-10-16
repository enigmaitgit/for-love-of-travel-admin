import { useState, useEffect, useCallback } from 'react';

export interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  children?: Category[];
  postCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  total: number;
  page: number;
  limit: number;
  count: number;
  error?: string;
}

export interface UseCategoriesOptions {
  page?: number;
  limit?: number;
  search?: string;
  parent?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options.page || 1);
  const [limit, setLimit] = useState(options.limit || 10);

  const fetchCategories = async (fetchOptions: UseCategoriesOptions = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (fetchOptions.page || page) {
        params.append('page', String(fetchOptions.page || page));
      }
      if (fetchOptions.limit || limit) {
        params.append('limit', String(fetchOptions.limit || limit));
      }
      if (fetchOptions.search || options.search) {
        params.append('search', fetchOptions.search || options.search || '');
      }
      if (fetchOptions.parent || options.parent) {
        params.append('parent', fetchOptions.parent || options.parent || '');
      }
      if (fetchOptions.sortBy || options.sortBy) {
        params.append('sortBy', fetchOptions.sortBy || options.sortBy || 'name');
      }
      if (fetchOptions.sortOrder || options.sortOrder) {
        params.append('sortOrder', fetchOptions.sortOrder || options.sortOrder || 'asc');
      }

      const response = await fetch(`/api/admin/categories?${params.toString()}`);
      const data: CategoriesResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      if (data.success) {
        // Transform the data to ensure id field exists
        const transformedCategories = (data.data || []).map((category: any) => ({
          ...category,
          id: category._id || category.id
        }));
        setCategories(transformedCategories);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setLimit(data.limit || 10);
      } else {
        throw new Error(data.error || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const refresh = () => {
    fetchCategories();
  };

  const updateOptions = (newOptions: UseCategoriesOptions) => {
    fetchCategories(newOptions);
  };

  return {
    categories,
    loading,
    error,
    total,
    page,
    limit,
    refresh,
    updateOptions,
    fetchCategories
  };
}

// Hook specifically for dashboard - fetches recent categories
export function useRecentCategories(limit: number = 6) {
  const { categories, loading, error, refresh } = useCategories({
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  return {
    recentCategories: categories,
    loading,
    error,
    refresh
  };
}




