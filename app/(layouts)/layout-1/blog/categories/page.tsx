'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Search, Filter, Eye, EyeOff, ChevronDown, ChevronRight, FolderPlus, ArrowUp, ArrowDown, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSnackbar } from '@/components/ui/snackbar';
import { getCurrentUserPermissions } from '@/lib/rbac';
import { getApiUrl } from '@/lib/api-config';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent?: string | {
    _id: string;
    name: string;
    slug: string;
    path: string;
    id: string;
  };
  parentId?: string;
  level?: number;
  path: string;
  order: number;
  sortOrder: number;
  navVisible: boolean;
  type: 'nav' | 'taxonomy';
  heroImageUrl?: string;
  isActive: boolean;
  isFeatured?: boolean;
  children?: Category[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  stats?: {
    postCount: number;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
  id?: string;
}

export default function CategoriesPage() {
  const { showSnackbar } = useSnackbar();
  const permissions = getCurrentUserPermissions();
  
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'tree'>('tree');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showSimpleCreateModal, setShowSimpleCreateModal] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = React.useState(false);
  const [subcategories, setSubcategories] = React.useState<Array<{name: string, description: string, order: number}>>([]);
  const [editingName, setEditingName] = React.useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = React.useState('');
  const [showReorderModal, setShowReorderModal] = React.useState(false);
  const [reorderCategories, setReorderCategories] = React.useState<Category[]>([]);

  // Form state for create/edit
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    color: '#3B82F6',
    parent: '',
    parentId: '',
    order: 0,
    navVisible: true,
    type: 'taxonomy' as 'nav' | 'taxonomy',
    heroImageUrl: '',
    isActive: true,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [] as string[]
    }
  });

  // Simple form state for quick category creation
  const [simpleFormData, setSimpleFormData] = React.useState({
    name: '',
    description: '',
    color: '#3B82F6',
    parent: '__no_parent__',
    isActive: true
  });

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both flat list and tree structure
      const [flatResponse, treeResponse] = await Promise.all([
        fetch('/api/admin/categories?includePostCount=true&includeInactive=true'),
        fetch('/api/admin/categories/tree?includeInactive=true')
      ]);
      
      const flatData = await flatResponse.json();
      const treeData = await treeResponse.json();
      
      if (flatData.success) {
        setCategories(flatData.data);
      } else {
        showSnackbar('Failed to fetch categories', 'error');
      }
      
      if (treeData.success) {
        setCategoryTree(treeData.data);
      } else {
        showSnackbar('Failed to fetch category tree', 'error');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && category.isActive) ||
                         (statusFilter === 'inactive' && !category.isActive);
    return matchesSearch && matchesStatus;
  });

  // Helper function to recursively filter tree structure
  const filterTreeRecursively = (categories: Category[]): Category[] => {
    return categories
      .filter(category => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             category.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'active' && category.isActive) ||
                             (statusFilter === 'inactive' && !category.isActive);
        return matchesSearch && matchesStatus;
      })
      .map(category => ({
        ...category,
        children: category.children ? filterTreeRecursively(category.children) : []
      }));
  };

  // Filter category tree (for tree view)
  const filteredCategoryTree = filterTreeRecursively(categoryTree);

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    // Validate that we're not trying to create a subcategory with children
    if (formData.parent && subcategories.length > 0) {
      showSnackbar('Subcategories cannot have their own children. Only top-level categories can have subcategories.', 'error');
      return;
    }

    // Validate subcategories
    const invalidSubcategories = subcategories.filter(sub => !sub.name.trim());
    if (invalidSubcategories.length > 0) {
      showSnackbar('All subcategories must have a name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for backend - only include parent fields if a parent is selected
      const categoryData: {
        name: string;
        description?: string;
        color: string;
        order: number;
        sortOrder: number;
        navVisible: boolean;
        type: 'nav' | 'taxonomy';
        heroImageUrl?: string;
        isActive: boolean;
        seo: {
          metaTitle?: string;
          metaDescription?: string;
          keywords?: string[];
        };
        parent?: string;
        parentId?: string;
      } = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        color: formData.color,
        order: formData.order,
        sortOrder: formData.order,
        navVisible: formData.navVisible,
        type: formData.type,
        heroImageUrl: formData.heroImageUrl?.trim() || undefined,
        isActive: formData.isActive,
        // Clean up empty SEO fields
        seo: {
          metaTitle: formData.seo.metaTitle?.trim() || undefined,
          metaDescription: formData.seo.metaDescription?.trim() || undefined,
          keywords: formData.seo.keywords?.length ? formData.seo.keywords : undefined
        }
      };

      // Only add parent fields if a parent is actually selected
      if (formData.parent && formData.parent.trim()) {
        categoryData.parent = formData.parent;
        categoryData.parentId = formData.parentId || formData.parent;
      }

      // First, create the parent category
      const parentResponse = await fetch(getApiUrl('admin/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      const parentData = await parentResponse.json();
      
      if (!parentData.success) {
        showSnackbar(parentData.message || 'Failed to create parent category', 'error');
        return;
      }

      const parentCategoryId = parentData.data._id;

      // Then create subcategories if any
      if (subcategories.length > 0) {
        const subcategoryPromises = subcategories.map(subcategory => 
          fetch(getApiUrl('admin/categories'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: subcategory.name.trim(),
              description: subcategory.description?.trim() || undefined,
              parent: parentCategoryId,
              parentId: parentCategoryId,
              order: subcategory.order,
              sortOrder: subcategory.order,
              navVisible: true,
              type: 'taxonomy',
              color: formData.color,
              isActive: formData.isActive,
              seo: {
                metaTitle: undefined,
                metaDescription: undefined,
                keywords: undefined
              }
            }),
          })
        );

        const subcategoryResponses = await Promise.all(subcategoryPromises);
        const subcategoryResults = await Promise.all(subcategoryResponses.map(res => res.json()));
        
        const failedSubcategories = subcategoryResults.filter(result => !result.success);
        if (failedSubcategories.length > 0) {
          showSnackbar(`Parent category created, but ${failedSubcategories.length} subcategories failed to create`, 'warning');
        } else {
          showSnackbar(`Category and ${subcategories.length} subcategories created successfully`, 'success');
        }
      } else {
        showSnackbar('Category created successfully', 'success');
      }

      setShowCreateModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      showSnackbar('Failed to create category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(getApiUrl(`admin/categories/${editingCategory._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Category updated successfully', 'success');
        setEditingCategory(null);
        resetForm();
        fetchCategories();
      } else {
        showSnackbar(data.message || 'Failed to update category', 'error');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showSnackbar('Failed to update category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(getApiUrl(`admin/categories/${categoryToDelete._id}`), {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Category deleted successfully', 'success');
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        fetchCategories();
      } else {
        showSnackbar(data.message || 'Failed to delete category', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showSnackbar('Failed to delete category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple category creation handler
  const handleSimpleCreateCategory = async () => {
    if (!simpleFormData.name.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build category data - only include parent fields if a parent is selected
      const categoryData: {
        name: string;
        description?: string;
        color: string;
        order: number;
        sortOrder: number;
        navVisible: boolean;
        type: 'nav' | 'taxonomy';
        heroImageUrl?: string;
        isActive: boolean;
        seo: {
          metaTitle?: string;
          metaDescription?: string;
          keywords?: string[];
        };
        parent?: string;
        parentId?: string;
      } = {
        name: simpleFormData.name.trim(),
        description: simpleFormData.description?.trim() || undefined,
        color: simpleFormData.color,
        order: 0,
        sortOrder: 0,
        navVisible: true,
        type: 'taxonomy',
        heroImageUrl: undefined,
        isActive: simpleFormData.isActive,
        seo: {
          metaTitle: undefined,
          metaDescription: undefined,
          keywords: undefined
        }
      };

      // Only add parent fields if a parent is actually selected
      if (simpleFormData.parent && simpleFormData.parent !== '__no_parent__') {
        categoryData.parent = simpleFormData.parent;
        categoryData.parentId = simpleFormData.parent;
      }

      const response = await fetch(getApiUrl('admin/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Simple create HTTP error:', response.status, errorText);
        showSnackbar(`HTTP ${response.status}: Failed to create category`, 'error');
        return;
      }

      const data = await response.json();
      
      if (data && data.success) {
        showSnackbar('Category created successfully', 'success');
        setShowSimpleCreateModal(false);
        setSimpleFormData({
          name: '',
          description: '',
          color: '#3B82F6',
          parent: '__no_parent__',
          isActive: true
        });
        fetchCategories();
      } else {
        console.error('Simple create failed:', data);
        showSnackbar(data?.message || data?.error || 'Failed to create category', 'error');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showSnackbar('Failed to create category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
      parent: typeof category.parent === 'string' ? category.parent : (category.parent?._id || ''),
      parentId: category.parentId || '',
      order: category.order || 0,
      navVisible: category.navVisible,
      type: category.type || 'taxonomy',
      heroImageUrl: category.heroImageUrl || '',
      isActive: category.isActive,
      seo: {
        metaTitle: category.seo?.metaTitle || '',
        metaDescription: category.seo?.metaDescription || '',
        keywords: category.seo?.keywords || []
      }
    });
  };

  const openDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      parent: '',
      parentId: '',
      order: 0,
      navVisible: true,
      type: 'taxonomy',
      heroImageUrl: '',
      isActive: true,
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: []
      }
    });
    setEditingCategory(null);
    setSubcategories([]);
  };

  // Subcategory management functions
  const addSubcategory = () => {
    setSubcategories([...subcategories, { name: '', description: '', order: subcategories.length + 1 }]);
  };

  const removeSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const updateSubcategory = (index: number, field: string, value: string | number) => {
    const updated = [...subcategories];
    updated[index] = { ...updated[index], [field]: value };
    setSubcategories(updated);
  };

  // Rename functionality
  const startRename = (category: Category) => {
    setEditingName(category._id);
    setEditingNameValue(category.name);
  };

  const cancelRename = () => {
    setEditingName(null);
    setEditingNameValue('');
  };

  const saveRename = async (categoryId: string) => {
    if (!editingNameValue.trim()) {
      showSnackbar('Category name cannot be empty', 'error');
      return;
    }

    // Generate new slug from the new name
    const newSlug = editingNameValue.trim()
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      const response = await fetch(getApiUrl(`admin/categories/${categoryId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: editingNameValue.trim(),
          slug: newSlug
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Category renamed successfully. URL has been updated to match the new name.', 'success');
        setEditingName(null);
        setEditingNameValue('');
        fetchCategories();
      } else {
        showSnackbar(data.message || 'Failed to rename category', 'error');
      }
    } catch (error) {
      console.error('Error renaming category:', error);
      showSnackbar('Failed to rename category', 'error');
    }
  };

  // Reorder functionality
  const openReorderModal = () => {
    // Get only top-level categories (no parent) and sort by order
    const topLevelCategories = categories
      .filter(cat => !cat.parent)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    setReorderCategories(topLevelCategories);
    setShowReorderModal(true);
  };

  const moveCategoryUp = (index: number) => {
    if (index > 0) {
      const newCategories = [...reorderCategories];
      [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
      setReorderCategories(newCategories);
    }
  };

  const moveCategoryDown = (index: number) => {
    if (index < reorderCategories.length - 1) {
      const newCategories = [...reorderCategories];
      [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
      setReorderCategories(newCategories);
    }
  };

  const saveReorder = async () => {
    setIsSubmitting(true);
    try {
      const updatePromises = reorderCategories.map((category, index) => 
        fetch(getApiUrl(`admin/categories/${category._id}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order: index + 1 }),
        })
      );

      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map(res => res.json()));
      
      const failedUpdates = results.filter(result => !result.success);
      if (failedUpdates.length > 0) {
        showSnackbar(`Failed to update order for ${failedUpdates.length} categories`, 'error');
      } else {
        showSnackbar('Category order updated successfully', 'success');
        setShowReorderModal(false);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error updating category order:', error);
      showSnackbar('Failed to update category order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      showSnackbar('Please select categories to delete', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const deletePromises = Array.from(selectedCategories).map(categoryId =>
        fetch(getApiUrl(`admin/categories/${categoryId}`), {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        showSnackbar(`Successfully deleted ${successCount} categories${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success');
        setSelectedCategories(new Set());
        setShowBulkActions(false);
        fetchCategories();
      } else {
        showSnackbar('Failed to delete categories', 'error');
      }
    } catch (error) {
      console.error('Error bulk deleting categories:', error);
      showSnackbar('Failed to delete categories', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedCategories.size === 0) {
      showSnackbar('Please select categories to update', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatePromises = Array.from(selectedCategories).map(categoryId =>
        fetch(getApiUrl(`admin/categories/${categoryId}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        })
      );

      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        showSnackbar(`Successfully ${isActive ? 'activated' : 'deactivated'} ${successCount} categories${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success');
        setSelectedCategories(new Set());
        setShowBulkActions(false);
        fetchCategories();
      } else {
        showSnackbar(`Failed to ${isActive ? 'activate' : 'deactivate'} categories`, 'error');
      }
    } catch (error) {
      console.error('Error bulk updating categories:', error);
      showSnackbar(`Failed to ${isActive ? 'activate' : 'deactivate'} categories`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllCategories = () => {
    const allIds = new Set(filteredCategories.map(cat => cat._id));
    setSelectedCategories(allIds);
    setShowBulkActions(allIds.size > 0);
  };

  const clearSelection = () => {
    setSelectedCategories(new Set());
    setShowBulkActions(false);
  };

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(getApiUrl(`admin/categories/${categoryId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        fetchCategories();
      } else {
        showSnackbar(data.message || 'Failed to update category', 'error');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showSnackbar('Failed to update category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tree view helper functions
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (category: Category, level: number = 0) => {
    // Limit to 2 levels maximum
    if (level >= 2) return null;
    
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category._id);
    const indent = level * 24;
    const isSubcategory = level === 1;

    return (
      <div key={category._id} className="border-b border-gray-100 last:border-b-0">
        <div 
          className="flex items-center py-3 px-4 hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${indent + 16}px` }}
        >
          <div className="flex items-center flex-1">
            <input
              type="checkbox"
              checked={selectedCategories.has(category._id)}
              onChange={() => toggleCategorySelection(category._id)}
              className="mr-3 h-4 w-4"
            />
            {hasChildren && !isSubcategory ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mr-2"
                onClick={() => toggleNode(category._id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            <div
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: category.color || '#3B82F6' }}
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {editingName === category._id ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveRename(category._id);
                        } else if (e.key === 'Escape') {
                          cancelRename();
                        }
                      }}
                      className="h-8 text-sm font-medium"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => saveRename(category._id)}
                      className="h-8 w-8 p-0 text-green-600"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelRename}
                      className="h-8 w-8 p-0 text-red-600"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <span 
                    className="font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                    onClick={() => startRename(category)}
                    title="Click to rename"
                  >
                    {category.name}
                  </span>
                )}
                <Badge variant={category.isActive ? 'primary' : 'secondary'}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {isSubcategory ? (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Subcategory
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    Parent
                  </Badge>
                )}
                {category.navVisible && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Eye className="h-3 w-3 mr-1" />
                    Nav
                  </Badge>
                )}
                <Badge variant="outline">
                  {category.type}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                {category.description && (
                  <span>{category.description}</span>
                )}
                <span className="ml-2">• {category.stats?.postCount || 0} posts</span>
                <span className="ml-2">• Order: {category.order}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategoryStatus(category._id, category.isActive)}
              title={`${category.isActive ? 'Deactivate' : 'Activate'} category`}
              disabled={isSubmitting}
            >
              {category.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {permissions.includes('category:edit') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditModal(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {permissions.includes('category:delete') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteModal(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 ml-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage blog post categories and navigation structure
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'tree' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tree')}
            >
              Tree View
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
          </div>
          
          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedCategories.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleStatus(true)}
                disabled={isSubmitting}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleStatus(false)}
                disabled={isSubmitting}
              >
                Deactivate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isSubmitting}
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                Clear
              </Button>
            </div>
          )}
          
          {permissions.includes('category:create') && (
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSimpleCreateModal(true)}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Create
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(true);
                  // Focus on subcategories tab after modal opens
                  setTimeout(() => {
                    const subcategoriesTab = document.querySelector('[value="subcategories"]') as HTMLElement;
                    if (subcategoriesTab) {
                      subcategoriesTab.click();
                    }
                  }, 100);
                }}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Parent + Subcategories
              </Button>
            </div>
          )}
          
          {/* Reorder button - no permission restrictions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={openReorderModal}
              disabled={categories.filter(cat => !cat.parent).length < 2}
              title={categories.filter(cat => !cat.parent).length < 2 ? "Need at least 2 top-level categories to reorder" : "Reorder navigation categories"}
            >
              <List className="h-4 w-4 mr-2" />
              Reorder Navigation
              {categories.filter(cat => !cat.parent).length < 2 && (
                <span className="ml-2 text-xs text-gray-500">({categories.filter(cat => !cat.parent).length} categories)</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <div className="flex items-center space-x-2 ml-8">
              <input
                type="checkbox"
                checked={selectedCategories.size === filteredCategories.length && filteredCategories.length > 0}
                onChange={selectedCategories.size === filteredCategories.length ? clearSelection : selectAllCategories}
                className="h-4 w-4"
              />
              <Label className="text-sm">Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Content */}
      {viewMode === 'tree' ? (
        <Card>
          <CardHeader>
            <CardTitle>Category Tree</CardTitle>
            <p className="text-sm text-muted-foreground">
              Hierarchical view of your categories. Click the arrows to expand/collapse.
            </p>
          </CardHeader>
           <CardContent className="p-0">
             {filteredCategoryTree.length > 0 ? (
               <div className="divide-y divide-gray-100">
                 {filteredCategoryTree.map(category => renderTreeNode(category))}
               </div>
             ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No categories found</h3>
                  <p className="text-sm">Get started by creating your first category.</p>
                </div>
                {permissions.includes('category:create') && (
                  <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const isSubcategory = !!category.parent;
            const parentId = typeof category.parent === 'string' ? category.parent : category.parent?._id;
            const parentCategory = isSubcategory ? categories.find(cat => cat._id === parentId) : null;
            
            return (
            <Card key={category._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(category._id)}
                      onChange={() => toggleCategorySelection(category._id)}
                      className="h-4 w-4"
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || '#3B82F6' }}
                    />
                    {editingName === category._id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveRename(category._id);
                            } else if (e.key === 'Escape') {
                              cancelRename();
                            }
                          }}
                          className="h-8 text-lg font-semibold"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveRename(category._id)}
                          className="h-8 w-8 p-0 text-green-600"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelRename}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <CardTitle 
                        className="text-lg cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        onClick={() => startRename(category)}
                        title="Click to rename"
                      >
                        {category.name}
                      </CardTitle>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategoryStatus(category._id, category.isActive)}
                      title={`${category.isActive ? 'Deactivate' : 'Activate'} category`}
                      disabled={isSubmitting}
                    >
                      {category.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    {permissions.includes('category:edit') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {permissions.includes('category:delete') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isSubcategory && parentCategory && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Parent: {parentCategory.name}
                    </div>
                  )}
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={category.isActive ? 'primary' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {isSubcategory ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          Subcategory
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          Parent
                        </Badge>
                      )}
                      {category.navVisible && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Nav
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {category.stats?.postCount || 0} posts
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>Slug: {category.slug}</div>
                    <div>Type: {category.type} • Order: {category.order}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'grid' && filteredCategories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first category.'
                }
              </p>
            </div>
            {permissions.includes('category:create') && (
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Category Modal */}
      <Dialog open={showCreateModal || !!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setEditingCategory(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category details' : 'Add a new category for your blog posts'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="heroImageUrl">Hero Image URL</Label>
                <Input
                  id="heroImageUrl"
                  value={formData.heroImageUrl}
                  onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="navigation" className="space-y-4">
              <div>
                <Label htmlFor="parent">Parent Category</Label>
                <Select 
                  value={formData.parent} 
                  onValueChange={(value) => setFormData({ ...formData, parent: value, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent (top-level)</SelectItem>
                    {categories.filter(cat => !cat.parent && cat._id !== editingCategory?._id).map(category => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Only top-level categories can be parents. Subcategories cannot have children.
                </p>
              </div>
              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="type">Category Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'nav' | 'taxonomy') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nav">Navigation (appears in main nav)</SelectItem>
                    <SelectItem value="taxonomy">Taxonomy (content organization)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="navVisible"
                  checked={formData.navVisible}
                  onCheckedChange={(checked) => setFormData({ ...formData, navVisible: checked })}
                />
                <Label htmlFor="navVisible">Visible in Navigation</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="subcategories" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Subcategories</h3>
                    <p className="text-sm text-muted-foreground">
                      Add subcategories that will be children of this category. Subcategories cannot have their own children.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addSubcategory}
                    disabled={editingCategory !== null}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </Button>
                </div>
                
                {editingCategory && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Subcategories can only be added when creating a new category, not when editing existing ones.
                    </p>
                  </div>
                )}
                
                {editingCategory && editingCategory.parent && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> This is a subcategory and cannot have its own subcategories. Only top-level categories can have children.
                    </p>
                  </div>
                )}
                
                {subcategories.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-muted-foreground">
                      <FolderPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No subcategories</h3>
                      <p className="text-sm">Click "Add Subcategory" to create child categories</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subcategories.map((subcategory, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium">Subcategory {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubcategory(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`subcategory-name-${index}`}>Name *</Label>
                            <Input
                              id={`subcategory-name-${index}`}
                              value={subcategory.name}
                              onChange={(e) => updateSubcategory(index, 'name', e.target.value)}
                              placeholder="Subcategory name"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`subcategory-order-${index}`}>Order</Label>
                            <Input
                              id={`subcategory-order-${index}`}
                              type="number"
                              value={subcategory.order}
                              onChange={(e) => updateSubcategory(index, 'order', parseInt(e.target.value) || 0)}
                              placeholder="Display order"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label htmlFor={`subcategory-description-${index}`}>Description</Label>
                          <Textarea
                            id={`subcategory-description-${index}`}
                            value={subcategory.description}
                            onChange={(e) => updateSubcategory(index, 'description', e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.seo.metaTitle}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    seo: { ...formData.seo, metaTitle: e.target.value }
                  })}
                  placeholder="SEO title for search engines"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.seo.metaTitle.length}/60 characters
                </p>
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.seo.metaDescription}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    seo: { ...formData.seo, metaDescription: e.target.value }
                  })}
                  placeholder="SEO description for search engines"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.seo.metaDescription.length}/160 characters
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingCategory ? handleEditCategory : handleCreateCategory}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {categoryToDelete?.stats?.postCount && categoryToDelete.stats.postCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: This category has {categoryToDelete.stats.postCount} posts. 
                  You may want to move these posts to another category first.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Modal */}
      <Dialog open={showReorderModal} onOpenChange={setShowReorderModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reorder Navigation Categories</DialogTitle>
            <DialogDescription>
              Drag and drop or use the arrow buttons to reorder how categories appear in the navigation menu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reorderCategories.map((category, index) => (
              <div
                key={category._id}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  />
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">
                      {category.description || 'No description'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={category.isActive ? 'primary' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {category.navVisible && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Eye className="h-3 w-3 mr-1" />
                      Nav
                    </Badge>
                  )}
                  
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCategoryUp(index)}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCategoryDown(index)}
                      disabled={index === reorderCategories.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReorderModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveReorder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Category Creation Modal */}
      <Dialog open={showSimpleCreateModal} onOpenChange={setShowSimpleCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Create Category</DialogTitle>
            <DialogDescription>
              Create a new category quickly with just the essential information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="simple-name">Category Name *</Label>
              <Input
                id="simple-name"
                value={simpleFormData.name}
                onChange={(e) => setSimpleFormData({ ...simpleFormData, name: e.target.value })}
                placeholder="Enter category name"
                className="text-lg"
              />
            </div>
            
            <div>
              <Label htmlFor="simple-description">Description</Label>
              <Textarea
                id="simple-description"
                value={simpleFormData.description}
                onChange={(e) => setSimpleFormData({ ...simpleFormData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="simple-color">Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="simple-color"
                    type="color"
                    value={simpleFormData.color}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, color: e.target.value })}
                    className="w-12 h-10 rounded"
                  />
                  <Input
                    value={simpleFormData.color}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="simple-parent">Parent Category</Label>
                <Select 
                  value={simpleFormData.parent} 
                  onValueChange={(value) => setSimpleFormData({ ...simpleFormData, parent: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_parent__">No parent (top-level)</SelectItem>
                    {categories.filter(cat => !cat.parent).map(category => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="simple-active"
                checked={simpleFormData.isActive}
                onCheckedChange={(checked) => setSimpleFormData({ ...simpleFormData, isActive: checked })}
              />
              <Label htmlFor="simple-active">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSimpleCreateModal(false);
                setSimpleFormData({
                  name: '',
                  description: '',
                  color: '#3B82F6',
                  parent: '__no_parent__',
                  isActive: true
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSimpleCreateCategory}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

