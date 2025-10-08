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
      const response = await fetch('/api/admin/categories?includePostCount=true');
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
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCategory,
          isActive: true
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
    
    if (isSelected) {
      // Remove category
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Add category (check max selections)
      if (maxSelections && selectedCategories.length >= maxSelections) {
        toast.warning(`Maximum ${maxSelections} categories allowed`);
        return;
      }
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
  };

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat._id === id);
  };

  const filteredCategories = categories.filter(category =>
    category.isActive && 
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

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
                selectedCategoryObjects.map(category => (
                  <Badge
                    key={category._id}
                    variant="secondary"
                    className="text-xs"
                    style={{ 
                      backgroundColor: category.color ? `${category.color}20` : undefined,
                      borderColor: category.color || undefined
                    }}
                  >
                    {category.name}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCategory(category._id);
                      }}
                      className="ml-1 hover:text-destructive cursor-pointer inline-flex items-center"
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </Badge>
                ))
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
                <CommandGroup>
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategories.includes(category._id);
                    return (
                      <CommandItem
                        key={category._id}
                        value={category._id}
                        onSelect={() => handleCategoryToggle(category._id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color || '#3B82F6' }}
                          />
                          <span>{category.name}</span>
                          {category.stats && (
                            <span className="text-xs text-muted-foreground">
                              ({category.stats.postCount} posts)
                            </span>
                          )}
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                  <CommandItem
                    onSelect={() => setShowCreateDialog(true)}
                    className="flex items-center justify-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Category
                  </CommandItem>
                </CommandGroup>
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

