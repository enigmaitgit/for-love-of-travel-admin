'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  Settings,
  Palette,
  Type,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';

interface SubcategoryPage {
  _id: string;
  subcategory: {
    _id: string;
    name: string;
    slug: string;
  };
  hero: {
    title: string;
    description: string;
    backgroundImage: string;
    backgroundImageAlt: string;
    overlayOpacity: number;
  };
  sections: {
    latestPosts: {
      isEnabled: boolean;
      title: string;
      postCount: number;
    };
    popularPosts: {
      isEnabled: boolean;
      title: string;
      postCount: number;
    };
    videos: {
      isEnabled: boolean;
      title: string;
      videoCount: number;
    };
    framerCards: {
      isEnabled: boolean;
      title: string;
      cards: Array<{
        title: string;
        description: string;
        image: string;
        category: string;
        readTime: string;
        date: string;
      }>;
    };
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  isActive: boolean;
  fallbackContent: {
    title: string;
    message: string;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
}

export default function SubcategoryPagesPage() {
  const [pages, setPages] = useState<SubcategoryPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<SubcategoryPage | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    subcategory: '',
    hero: {
      title: '',
      description: '',
      backgroundImage: '',
      backgroundImageAlt: '',
      overlayOpacity: 0.3
    },
    sections: {
      latestPosts: {
        isEnabled: true,
        title: 'Latest Posts',
        postCount: 7
      },
      popularPosts: {
        isEnabled: true,
        title: 'Popular Posts',
        postCount: 4
      },
      videos: {
        isEnabled: true,
        title: 'Popular Videos',
        videoCount: 4
      },
      framerCards: {
        isEnabled: true,
        title: 'Featured Stories',
        cards: []
      }
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    },
    fallbackContent: {
      title: 'No posts available',
      message: 'Posts are not available for this subcategory yet. Check back soon!'
    }
  });

  useEffect(() => {
    fetchPages();
    fetchCategories();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/subcategory-pages');
      const data = await response.json();
      
      if (data.success) {
        setPages(data.data);
      } else {
        toast.error('Failed to fetch subcategory pages');
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Error fetching subcategory pages');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/categories');
      const data = await response.json();
      
      if (data.success) {
        // Filter for subcategories (categories with parent)
        const subcategories = data.data.filter((cat: Category) => cat.parent !== null);
        setCategories(subcategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreatePage = async () => {
    try {
      const response = await fetch('/api/v1/subcategory-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subcategory page created successfully');
        setShowCreateForm(false);
        resetForm();
        fetchPages();
      } else {
        toast.error(data.message || 'Failed to create subcategory page');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Error creating subcategory page');
    }
  };

  const handleUpdatePage = async () => {
    if (!editingPage) return;

    try {
      const response = await fetch(`/api/v1/subcategory-pages/${editingPage._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subcategory page updated successfully');
        setEditingPage(null);
        resetForm();
        fetchPages();
      } else {
        toast.error(data.message || 'Failed to update subcategory page');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error('Error updating subcategory page');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory page?')) return;

    try {
      const response = await fetch(`/api/v1/subcategory-pages/${pageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Subcategory page deleted successfully');
        fetchPages();
      } else {
        toast.error(data.message || 'Failed to delete subcategory page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Error deleting subcategory page');
    }
  };

  const handleToggleStatus = async (pageId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/v1/subcategory-pages/${pageId}/toggle-status`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Page ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchPages();
      } else {
        toast.error(data.message || 'Failed to toggle page status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error toggling page status');
    }
  };

  const resetForm = () => {
    setFormData({
      subcategory: '',
      hero: {
        title: '',
        description: '',
        backgroundImage: '',
        backgroundImageAlt: '',
        overlayOpacity: 0.3
      },
      sections: {
        latestPosts: {
          isEnabled: true,
          title: 'Latest Posts',
          postCount: 7
        },
        popularPosts: {
          isEnabled: true,
          title: 'Popular Posts',
          postCount: 4
        },
        videos: {
          isEnabled: true,
          title: 'Popular Videos',
          videoCount: 4
        },
        framerCards: {
          isEnabled: true,
          title: 'Featured Stories',
          cards: []
        }
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: []
      },
      fallbackContent: {
        title: 'No posts available',
        message: 'Posts are not available for this subcategory yet. Check back soon!'
      }
    });
  };

  const startEditing = (page: SubcategoryPage) => {
    setEditingPage(page);
    setFormData({
      subcategory: page.subcategory._id,
      hero: page.hero,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sections: page.sections as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seo: page.seo as any,
      fallbackContent: page.fallbackContent
    });
  };

  const cancelEditing = () => {
    setEditingPage(null);
    setShowCreateForm(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2AD3F]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subcategory Pages</h1>
          <p className="text-gray-600 mt-2">Manage subcategory pages and customize their hero sections</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-[#D2AD3F] hover:bg-[#B8941F] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Page
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingPage) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {editingPage ? 'Edit Subcategory Page' : 'Create New Subcategory Page'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="hero" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Hero
                  </TabsTrigger>
                  <TabsTrigger value="sections" className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Sections
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger value="fallback" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Fallback
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Select 
                        value={formData.subcategory} 
                        onValueChange={(value) => setFormData({...formData, subcategory: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="heroTitle">Hero Title</Label>
                      <Input
                        id="heroTitle"
                        value={formData.hero.title}
                        onChange={(e) => setFormData({
                          ...formData,
                          hero: { ...formData.hero, title: e.target.value }
                        })}
                        placeholder="Enter hero title"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="heroDescription">Hero Description</Label>
                      <Textarea
                        id="heroDescription"
                        value={formData.hero.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          hero: { ...formData.hero, description: e.target.value }
                        })}
                        placeholder="Enter hero description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="backgroundImage">Background Image URL</Label>
                      <Input
                        id="backgroundImage"
                        value={formData.hero.backgroundImage}
                        onChange={(e) => setFormData({
                          ...formData,
                          hero: { ...formData.hero, backgroundImage: e.target.value }
                        })}
                        placeholder="Enter background image URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="overlayOpacity">Overlay Opacity</Label>
                      <Input
                        id="overlayOpacity"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.hero.overlayOpacity}
                        onChange={(e) => setFormData({
                          ...formData,
                          hero: { ...formData.hero, overlayOpacity: parseFloat(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sections" className="space-y-4">
                  <div className="space-y-6">
                    {/* Latest Posts Section */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Latest Posts Section</CardTitle>
                          <Switch
                            checked={formData.sections.latestPosts.isEnabled}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                latestPosts: { ...formData.sections.latestPosts, isEnabled: checked }
                              }
                            })}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="latestPostsTitle">Section Title</Label>
                          <Input
                            id="latestPostsTitle"
                            value={formData.sections.latestPosts.title}
                            onChange={(e) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                latestPosts: { ...formData.sections.latestPosts, title: e.target.value }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="latestPostsCount">Post Count</Label>
                          <Input
                            id="latestPostsCount"
                            type="number"
                            value={formData.sections.latestPosts.postCount}
                            onChange={(e) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                latestPosts: { ...formData.sections.latestPosts, postCount: parseInt(e.target.value) }
                              }
                            })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Popular Posts Section */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Popular Posts Section</CardTitle>
                          <Switch
                            checked={formData.sections.popularPosts.isEnabled}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                popularPosts: { ...formData.sections.popularPosts, isEnabled: checked }
                              }
                            })}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="popularPostsTitle">Section Title</Label>
                          <Input
                            id="popularPostsTitle"
                            value={formData.sections.popularPosts.title}
                            onChange={(e) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                popularPosts: { ...formData.sections.popularPosts, title: e.target.value }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="popularPostsCount">Post Count</Label>
                          <Input
                            id="popularPostsCount"
                            type="number"
                            value={formData.sections.popularPosts.postCount}
                            onChange={(e) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                popularPosts: { ...formData.sections.popularPosts, postCount: parseInt(e.target.value) }
                              }
                            })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Videos Section */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Videos Section</CardTitle>
                          <Switch
                            checked={formData.sections.videos.isEnabled}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                videos: { ...formData.sections.videos, isEnabled: checked }
                              }
                            })}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="videosTitle">Section Title</Label>
                          <Input
                            id="videosTitle"
                            value={formData.sections.videos.title}
                            onChange={(e) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                videos: { ...formData.sections.videos, title: e.target.value }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="videosCount">Video Count</Label>
                          <Input
                            id="videosCount"
                            type="number"
                            value={formData.sections.videos.videoCount}
                            onChange={(e) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                videos: { ...formData.sections.videos, videoCount: parseInt(e.target.value) }
                              }
                            })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={formData.seo.metaTitle}
                        onChange={(e) => setFormData({
                          ...formData,
                          seo: { ...formData.seo, metaTitle: e.target.value }
                        })}
                        placeholder="Enter meta title"
                      />
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
                        placeholder="Enter meta description"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fallback" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fallbackTitle">Fallback Title</Label>
                      <Input
                        id="fallbackTitle"
                        value={formData.fallbackContent.title}
                        onChange={(e) => setFormData({
                          ...formData,
                          fallbackContent: { ...formData.fallbackContent, title: e.target.value }
                        })}
                        placeholder="Enter fallback title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fallbackMessage">Fallback Message</Label>
                      <Textarea
                        id="fallbackMessage"
                        value={formData.fallbackContent.message}
                        onChange={(e) => setFormData({
                          ...formData,
                          fallbackContent: { ...formData.fallbackContent, message: e.target.value }
                        })}
                        placeholder="Enter fallback message"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={cancelEditing}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={editingPage ? handleUpdatePage : handleCreatePage}
                  className="bg-[#D2AD3F] hover:bg-[#B8941F] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPage ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <motion.div
            key={page._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{page.subcategory.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={page.isActive ? "secondary" : "outline"}>
                      {page.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(page._id, page.isActive)}
                    >
                      {page.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Hero Title:</strong> {page.hero.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Description:</strong> {page.hero.description.substring(0, 50)}...
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>URL:</strong> /destinations/{page.subcategory.slug}
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(page)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePage(page._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {pages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Settings className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No subcategory pages found</h3>
            <p className="text-sm">Create your first subcategory page to get started.</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-[#D2AD3F] hover:bg-[#B8941F] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Page
          </Button>
        </div>
      )}
    </div>
  );
}



