'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api-config';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  parent?: string;
  isActive: boolean;
  stats?: {
    postCount: number;
  };
}

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

export function CategorySelector({
  selectedCategories,
  onCategoriesChange,
  placeholder = "Select categories...",
  maxSelections,
  className
}: CategorySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [expandedParents, setExpandedParents] = React.useState<Set<string>>(new Set());
  const [newCategory, setNewCategory] = React.useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Fetch categories on component mount
  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('admin/categories?includePostCount=true'));
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(getApiUrl('admin/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description?.trim() || undefined,
          color: newCategory.color,
          parent: null,
          parentId: null,
          order: 0,
          sortOrder: 0,
          navVisible: true,
          type: 'taxonomy',
          heroImageUrl: undefined,
          isActive: true,
          seo: {
            metaTitle: undefined,
            metaDescription: undefined,
            keywords: undefined
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Category created successfully');
        setShowCreateDialog(false);
        setNewCategory({ name: '', description: '', color: '#3B82F6' });
        await fetchCategories(); // Refresh the list
        
        // Automatically select the newly created category
        const newCategoryId = data.data._id || data.data.id;
        if (newCategoryId && !selectedCategories.includes(newCategoryId)) {
          onCategoriesChange([...selectedCategories, newCategoryId]);
        }
      } else {
        toast.error(data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedCategories.includes(categoryId);
    const category = getCategoryById(categoryId);
    
    if (isSelected) {
      // Remove category
      const newSelection = selectedCategories.filter(id => id !== categoryId);
      
      // If removing a child category, check if parent should be removed
      if (category?.parent) {
        const parentId = category.parent;
        const hasOtherChildren = categories.some(cat => 
          cat.parent === parentId && 
          cat._id !== categoryId && 
          newSelection.includes(cat._id)
        );
        
        // Remove parent if no other children are selected
        if (!hasOtherChildren) {
          onCategoriesChange(newSelection.filter(id => id !== parentId));
        } else {
          onCategoriesChange(newSelection);
        }
      } else {
        onCategoriesChange(newSelection);
      }
    } else {
      // Add category (check max selections)
      if (maxSelections && selectedCategories.length >= maxSelections) {
        toast.warning(`Maximum ${maxSelections} categories allowed`);
        return;
      }
      
      const newSelection = [...selectedCategories, categoryId];
      
      // If selecting a child category, also select its parent
      if (category?.parent) {
        const parentId = category.parent;
        // Only add parent if not already selected
        if (!selectedCategories.includes(parentId)) {
          newSelection.push(parentId);
        }
      }
      
      onCategoriesChange(newSelection);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    const category = getCategoryById(categoryId);
    let newSelection = selectedCategories.filter(id => id !== categoryId);
    
    // If removing a child category, check if parent should be removed
    if (category?.parent) {
      const parentId = category.parent;
      const hasOtherChildren = categories.some(cat => 
        cat.parent === parentId && 
        cat._id !== categoryId && 
        newSelection.includes(cat._id)
      );
      
      // Remove parent if no other children are selected
      if (!hasOtherChildren) {
        newSelection = newSelection.filter(id => id !== parentId);
      }
    }
    
    // If removing a parent category, also remove all its children
    if (!category?.parent) {
      const children = categories.filter(cat => cat.parent === categoryId);
      const childIds = children.map(child => child._id);
      newSelection = newSelection.filter(id => !childIds.includes(id));
    }
    
    onCategoriesChange(newSelection);
  };

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat._id === id);
  };

  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const getChildrenForParent = (parentId: string) => {
    return categories.filter(category =>
      category.isActive && 
      category.parent === parentId &&
      category.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  const isParentExpanded = (parentId: string) => {
    return expandedParents.has(parentId);
  };

  // Separate parent and child categories
  const parentCategories = categories.filter(category =>
    category.isActive && 
    !category.parent && 
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const childCategories = categories.filter(category =>
    category.isActive && 
    category.parent && 
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const filteredCategories = [...parentCategories, ...childCategories];

  const selectedCategoryObjects = selectedCategories
    .map(id => getCategoryById(id))
    .filter(Boolean) as Category[];

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[40px] h-auto"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedCategoryObjects.length > 0 ? (
                (() => {
                  // Separate parent and child categories
                  const parentCategories = selectedCategoryObjects.filter(cat => !cat.parent);
                  const childCategories = selectedCategoryObjects.filter(cat => cat.parent);
                  
                  return (
                    <>
                      {/* Parent Categories - Blue theme */}
                      {parentCategories.map(category => (
                        <Badge
                          key={category._id}
                          variant="secondary"
                          className="text-xs font-medium bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                        >
                          {category.name}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCategory(category._id);
                            }}
                            className="ml-1 hover:bg-blue-300 cursor-pointer inline-flex items-center rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </div>
                        </Badge>
                      ))}
                      
                      {/* Child Categories - Green theme */}
                      {childCategories.map(category => {
                        const parentCategory = getCategoryById(category.parent!);
                        return (
                          <Badge
                            key={category._id}
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          >
                            {category.name}
                            {parentCategory && (
                              <span className="text-green-500 text-xs ml-1">({parentCategory.name})</span>
                            )}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCategory(category._id);
                              }}
                              className="ml-1 hover:bg-green-200 cursor-pointer inline-flex items-center rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </div>
                          </Badge>
                        );
                      })}
                    </>
                  );
                })()
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search categories..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {loading ? (
                <CommandEmpty>Loading categories...</CommandEmpty>
              ) : filteredCategories.length === 0 ? (
                <div className="p-4 text-center">
                  <CommandEmpty>No categories found.</CommandEmpty>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Category
                  </Button>
                </div>
              ) : (
                <>
                  {/* Parent Categories with Relational Display */}
                  {parentCategories.length > 0 && (
                    <CommandGroup heading="Categories">
                      {parentCategories.map((parentCategory) => {
                        const isParentSelected = selectedCategories.includes(parentCategory._id);
                        const isExpanded = isParentExpanded(parentCategory._id);
                        const children = getChildrenForParent(parentCategory._id);
                        const hasChildren = children.length > 0;

                        return (
                          <div key={parentCategory._id}>
                            {/* Parent Category */}
                            <CommandItem
                              value={parentCategory._id}
                              onSelect={() => {
                                if (hasChildren) {
                                  toggleParentExpansion(parentCategory._id);
                                } else {
                                  handleCategoryToggle(parentCategory._id);
                                }
                              }}
                              className="flex items-center justify-between font-medium"
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: parentCategory.color || '#3B82F6' }}
                                />
                                <span>{parentCategory.name}</span>
                                {parentCategory.stats && (
                                  <span className="text-xs text-muted-foreground">
                                    ({parentCategory.stats.postCount} posts)
                                  </span>
                                )}
                                {hasChildren && (
                                  <span className="text-xs text-muted-foreground">
                                    ({children.length} subcategories)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {hasChildren && (
                                  <span className="text-xs text-muted-foreground">
                                    {isExpanded ? '▼' : '▶'}
                                  </span>
                                )}
                                <Check
                                  className={cn(
                                    "h-4 w-4",
                                    isParentSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </div>
                            </CommandItem>

                            {/* Child Categories (only when parent is expanded) */}
                            {isExpanded && children.length > 0 && (
                              <div className="ml-4 border-l-2 border-gray-200 pl-2">
                                {children.map((childCategory) => {
                                  const isChildSelected = selectedCategories.includes(childCategory._id);
                                  return (
                                    <CommandItem
                                      key={childCategory._id}
                                      value={childCategory._id}
                                      onSelect={() => handleCategoryToggle(childCategory._id)}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: childCategory.color || '#3B82F6' }}
                                        />
                                        <span>{childCategory.name}</span>
                                        {childCategory.stats && (
                                          <span className="text-xs text-muted-foreground">
                                            ({childCategory.stats.postCount} posts)
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={isChildSelected}
                                          onChange={() => handleCategoryToggle(childCategory._id)}
                                          className="h-3 w-3 rounded border-gray-300"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <Check
                                          className={cn(
                                            "h-3 w-3",
                                            isChildSelected ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CommandGroup>
                  )}

                  <CommandItem
                    onSelect={() => setShowCreateDialog(true)}
                    className="flex items-center justify-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Category
                  </CommandItem>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          {selectedCategories.length}/{maxSelections} categories selected
        </p>
      )}

      {/* Create Category Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Name *</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Enter category description (optional)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="categoryColor">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="categoryColor"
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewCategory({ name: '', description: '', color: '#3B82F6' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={isCreating || !newCategory.name.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
