'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Eye, Edit3, Trash2, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { homepageSectionsApi } from '@/lib/api';

interface SectionConfig {
  [key: string]: unknown;
}

interface HomepageSection {
  _id: string;
  type: string;
  title: string;
  description?: string;
  config: SectionConfig;
  order: number;
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HomepageManager() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showDrafts, setShowDrafts] = useState(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [newSection, setNewSection] = useState<Partial<HomepageSection>>({
    type: 'popular-posts',
    title: '',
    description: '',
    config: {
      limit: 4,
      timeframe: '30d',
      algorithm: 'weighted',
      layout: 'grid',
      postType: 'all',
      showCategories: true,
      showReadTime: true,
      showPublishDate: true
    },
    order: 0,
    isActive: true,
    isPublished: false
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching sections...');
      // Fetch ALL sections (including drafts) instead of just published ones
      const response = await homepageSectionsApi.getHomepageSections({ 
        includeData: false // Don't fetch section data to avoid errors
      }) as { success: boolean; data?: HomepageSection[]; message?: string };
      console.log('📡 API Response:', response);
      if (response.success) {
        console.log('✅ Sections fetched successfully:', response.data?.length || 0, 'sections');
        setSections(response.data || []);
      } else {
        console.error('❌ API returned success: false');
        setError('Failed to fetch sections');
      }
    } catch (err) {
      console.error('❌ Error fetching sections:', err);
      setError('Error fetching sections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    try {
      const response = await homepageSectionsApi.createHomepageSection(newSection) as { success: boolean; data?: HomepageSection; message?: string };
      if (response.success) {
        setShowAddSection(false);
        setNewSection({
          type: 'popular-posts',
          title: '',
          description: '',
          config: {
            limit: 4,
            timeframe: '30d',
            algorithm: 'weighted',
            layout: 'grid',
            postType: 'all',
            showCategories: true,
            showReadTime: true,
            showPublishDate: true
          },
          order: 0,
          isActive: true,
          isPublished: false
        });
        fetchSections();
      } else {
        setError('Failed to create section');
      }
    } catch (err) {
      setError('Error creating section');
      console.error('Error creating section:', err);
    }
  };

  const handleUpdateSection = async (id: string, data: Partial<HomepageSection>) => {
    try {
      const response = await homepageSectionsApi.updateHomepageSection(id, data) as { success: boolean; data?: HomepageSection; message?: string };
      if (response.success) {
        setEditingSection(null);
        fetchSections();
      } else {
        setError('Failed to update section');
      }
    } catch (err) {
      setError('Error updating section');
      console.error('Error updating section:', err);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    try {
      const response = await homepageSectionsApi.deleteHomepageSection(id) as { success: boolean; message?: string };
      if (response.success) {
        fetchSections();
      } else {
        setError('Failed to delete section');
      }
    } catch (err) {
      setError('Error deleting section');
      console.error('Error deleting section:', err);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const response = await homepageSectionsApi.toggleSectionActive(id) as { success: boolean; message?: string };
      if (response.success) {
        fetchSections();
      } else {
        setError('Failed to toggle section status');
      }
    } catch (err) {
      setError('Error toggling section status');
      console.error('Error toggling section status:', err);
    }
  };

  const handlePublishSection = async (id: string) => {
    try {
      const response = await homepageSectionsApi.publishHomepageSection(id) as { success: boolean; message?: string };
      if (response.success) {
        fetchSections();
      } else {
        setError('Failed to publish section');
      }
    } catch (err) {
      setError('Error publishing section');
      console.error('Error publishing section:', err);
    }
  };

  const handleUnpublishSection = async (id: string) => {
    try {
      const response = await homepageSectionsApi.unpublishHomepageSection(id) as { success: boolean; message?: string };
      if (response.success) {
        fetchSections();
      } else {
        setError('Failed to unpublish section');
      }
    } catch (err) {
      setError('Error unpublishing section');
      console.error('Error unpublishing section:', err);
    }
  };

  const handleDuplicateSection = async (id: string) => {
    try {
      const response = await homepageSectionsApi.duplicateHomepageSection(id) as { success: boolean; data?: HomepageSection; message?: string };
      if (response.success) {
        fetchSections();
      } else {
        setError('Failed to duplicate section');
      }
    } catch (err) {
      setError('Error duplicating section');
      console.error('Error duplicating section:', err);
    }
  };

  const getSectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'hero': 'Hero Section',
      'popular-posts': 'Popular Posts',
      'featured-posts': 'Featured Posts',
      'latest-posts': 'Latest Posts',
      'filtered-articles': 'Filtered Articles',
      'video-showcase': 'Video Showcase',
      'newsletter-signup': 'Newsletter Signup',
      'text-block': 'Text Block',
      'image-gallery': 'Image Gallery',
      'custom': 'Custom Section'
    };
    return labels[type] || type;
  };

  const getSectionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'hero': 'bg-blue-500',
      'popular-posts': 'bg-green-500',
      'featured-posts': 'bg-purple-500',
      'latest-posts': 'bg-orange-500',
      'filtered-articles': 'bg-red-500',
      'video-showcase': 'bg-pink-500',
      'newsletter-signup': 'bg-indigo-500',
      'text-block': 'bg-gray-500',
      'image-gallery': 'bg-yellow-500',
      'custom': 'bg-teal-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Homepage Sections</h1>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">Homepage Sections</h1>
              <p className="text-gray-600">Manage and organize your homepage content sections</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2">
                <Switch
                  id="show-drafts"
                  checked={showDrafts}
                  onCheckedChange={setShowDrafts}
                />
                <Label htmlFor="show-drafts" className="text-sm font-medium text-gray-700">
                  Show Drafts
                </Label>
              </div>
              <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Add New Homepage Section</DialogTitle>
                    <p className="text-sm text-gray-600">Create a new section for your homepage</p>
                  </DialogHeader>
                  <AddSectionForm
                    section={newSection}
                    onChange={setNewSection}
                    onSubmit={handleCreateSection}
                    onCancel={() => setShowAddSection(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{sections.filter(s => s.isPublished).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Edit3 className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{sections.filter(s => !s.isPublished).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ToggleRight className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{sections.filter(s => s.isActive).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Sections Grid */}
        <div className="space-y-6">
          {sections.filter(section => showDrafts || section.isPublished).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sections found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {showDrafts 
                  ? "No sections match your current filter. Try adjusting the filters or create a new section."
                  : "Create your first homepage section to get started building your dynamic homepage."
                }
              </p>
              <Button 
                onClick={() => setShowAddSection(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          ) : (
            sections.filter(section => showDrafts || section.isPublished).map((section) => (
              <Card key={section._id} className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn('w-4 h-4 rounded-full mt-1.5 flex-shrink-0', getSectionTypeColor(section.type))} />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {section.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {section.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getSectionTypeLabel(section.type)}
                          </Badge>
                          <Badge 
                            variant={section.isActive ? 'secondary' : 'outline'}
                            className={cn(
                              "text-xs",
                              section.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {section.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge 
                            variant={section.isPublished ? 'secondary' : 'outline'}
                            className={cn(
                              "text-xs",
                              section.isPublished 
                                ? "bg-blue-100 text-blue-800 border-blue-200" 
                                : "bg-orange-100 text-orange-800 border-orange-200"
                            )}
                          >
                            {section.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Order: {section.order}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(section._id)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title={section.isActive ? 'Deactivate section' : 'Activate section'}
                      >
                        {section.isActive ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => section.isPublished ? handleUnpublishSection(section._id) : handlePublishSection(section._id)}
                        className="h-8 px-3 text-xs hover:bg-gray-100"
                        title={section.isPublished ? 'Unpublish section' : 'Publish section'}
                      >
                        {section.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSection(section)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit section"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateSection(section._id)}
                        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                        title="Duplicate section"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section._id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700">Order</span>
                      <span className="text-gray-600">{section.order}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700">Created</span>
                      <span className="text-gray-600">{new Date(section.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700">Updated</span>
                      <span className="text-gray-600">{new Date(section.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {section.publishedAt && (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700">Published</span>
                        <span className="text-gray-600">{new Date(section.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>
      </div>

      {/* Edit Section Dialog */}
      {editingSection && (
        <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Homepage Section</DialogTitle>
            </DialogHeader>
            <EditSectionForm
              section={editingSection}
              onSave={(data) => handleUpdateSection(editingSection._id, data)}
              onCancel={() => setEditingSection(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Add Section Form Component
function AddSectionForm({ section, onChange, onSubmit, onCancel }: {
  section: Partial<HomepageSection>;
  onChange: (section: Partial<HomepageSection>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Section Type</Label>
          <Select
            value={section.type}
            onValueChange={(value) => onChange({ ...section, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero Section</SelectItem>
              <SelectItem value="popular-posts">Popular Posts</SelectItem>
              <SelectItem value="featured-posts">Featured Posts</SelectItem>
              <SelectItem value="latest-posts">Latest Posts</SelectItem>
              <SelectItem value="filtered-articles">Filtered Articles</SelectItem>
              <SelectItem value="video-showcase">Video Showcase</SelectItem>
              <SelectItem value="newsletter-signup">Newsletter Signup</SelectItem>
              <SelectItem value="text-block">Text Block</SelectItem>
              <SelectItem value="image-gallery">Image Gallery</SelectItem>
              <SelectItem value="custom">Custom Section</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            value={section.order}
            onChange={(e) => onChange({ ...section, order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Section title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={section.description}
          onChange={(e) => onChange({ ...section, description: e.target.value })}
          placeholder="Section description (optional)"
        />
      </div>

      {/* Section-specific configuration */}
      {(section.type === 'popular-posts' || section.type === 'featured-posts') && (
        <PopularPostsConfig
          config={section.config || {}}
          onChange={(config) => onChange({ ...section, config })}
        />
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={section.isActive}
            onCheckedChange={(checked) => onChange({ ...section, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isPublished"
            checked={section.isPublished}
            onCheckedChange={(checked) => onChange({ ...section, isPublished: checked })}
          />
          <Label htmlFor="isPublished">Published</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          Create Section
        </Button>
      </div>
    </div>
  );
}

// Edit Section Form Component
function EditSectionForm({ section, onSave, onCancel }: {
  section: HomepageSection;
  onSave: (data: Partial<HomepageSection>) => void;
  onCancel: () => void;
}) {
  const [editedSection, setEditedSection] = useState<HomepageSection>(section);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Section Type</Label>
          <Select
            value={editedSection.type}
            onValueChange={(value) => setEditedSection({ ...editedSection, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero Section</SelectItem>
              <SelectItem value="popular-posts">Popular Posts</SelectItem>
              <SelectItem value="featured-posts">Featured Posts</SelectItem>
              <SelectItem value="latest-posts">Latest Posts</SelectItem>
              <SelectItem value="filtered-articles">Filtered Articles</SelectItem>
              <SelectItem value="video-showcase">Video Showcase</SelectItem>
              <SelectItem value="newsletter-signup">Newsletter Signup</SelectItem>
              <SelectItem value="text-block">Text Block</SelectItem>
              <SelectItem value="image-gallery">Image Gallery</SelectItem>
              <SelectItem value="custom">Custom Section</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            value={editedSection.order}
            onChange={(e) => setEditedSection({ ...editedSection, order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={editedSection.title}
          onChange={(e) => setEditedSection({ ...editedSection, title: e.target.value })}
          placeholder="Section title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={editedSection.description}
          onChange={(e) => setEditedSection({ ...editedSection, description: e.target.value })}
          placeholder="Section description (optional)"
        />
      </div>

      {/* Section-specific configuration */}
      {(editedSection.type === 'popular-posts' || editedSection.type === 'featured-posts') && (
        <PopularPostsConfig
          config={editedSection.config}
          onChange={(config) => setEditedSection({ ...editedSection, config })}
        />
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={editedSection.isActive}
            onCheckedChange={(checked) => setEditedSection({ ...editedSection, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isPublished"
            checked={editedSection.isPublished}
            onCheckedChange={(checked) => setEditedSection({ ...editedSection, isPublished: checked })}
          />
          <Label htmlFor="isPublished">Published</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(editedSection)}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// Popular Posts Configuration Component
function PopularPostsConfig({ config, onChange }: {
  config: SectionConfig;
  onChange: (config: SectionConfig) => void;
}) {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h4 className="font-medium">Popular Posts Configuration</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="limit">Post Limit</Label>
          <Select
            value={config.limit?.toString()}
            onValueChange={(value) => onChange({ ...config, limit: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Posts</SelectItem>
              <SelectItem value="4">4 Posts</SelectItem>
              <SelectItem value="6">6 Posts</SelectItem>
              <SelectItem value="8">8 Posts</SelectItem>
              <SelectItem value="10">10 Posts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="timeframe">Timeframe</Label>
          <Select
            value={config.timeframe as string}
            onValueChange={(value) => onChange({ ...config, timeframe: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="algorithm">Algorithm</Label>
          <Select
            value={config.algorithm as string}
            onValueChange={(value) => onChange({ ...config, algorithm: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weighted">Weighted (Views + Time)</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alltime">All Time Views</SelectItem>
              <SelectItem value="analytics">Analytics Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="layout">Layout</Label>
          <Select
            value={config.layout as string}
            onValueChange={(value) => onChange({ ...config, layout: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid Layout</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
              <SelectItem value="featured">Featured + Side</SelectItem>
              <SelectItem value="masonry">Masonry</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <h5 className="font-medium">Display Options</h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="showCategories"
              checked={config.showCategories as boolean}
              onCheckedChange={(checked) => onChange({ ...config, showCategories: checked })}
            />
            <Label htmlFor="showCategories">Show Categories</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="showReadTime"
              checked={config.showReadTime as boolean}
              onCheckedChange={(checked) => onChange({ ...config, showReadTime: checked })}
            />
            <Label htmlFor="showReadTime">Show Read Time</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="showPublishDate"
              checked={config.showPublishDate as boolean}
              onCheckedChange={(checked) => onChange({ ...config, showPublishDate: checked })}
            />
            <Label htmlFor="showPublishDate">Show Publish Date</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="showExcerpt"
              checked={config.showExcerpt as boolean}
              onCheckedChange={(checked) => onChange({ ...config, showExcerpt: checked })}
            />
            <Label htmlFor="showExcerpt">Show Excerpt</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
