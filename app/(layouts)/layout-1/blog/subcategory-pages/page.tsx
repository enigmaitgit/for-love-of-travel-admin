'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Layout,
  ChevronDown,
  ChevronRight,
  Search,
  Check,
  Folder,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { MediaLibrary } from '@/components/cms/MediaLibrary';

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
  parent?: string | {
    _id: string;
    name: string;
    slug: string;
    path: string;
    id: string;
  };
  parentId?: string;
  parentName?: string;
  isActive?: boolean;
}

// Using the existing MediaAsset interface from the admin panel
import { MediaAsset } from '@/lib/api';

export default function SubcategoryPagesPage() {
  const [pages, setPages] = useState<SubcategoryPage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<{[key: string]: Category[]}>({});
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<{[key: string]: Category[]}>({});
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<SubcategoryPage | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    subcategory: '',
    isActive: true,
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
      const response = await fetch('/api/admin/subcategory-pages');
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
      const response = await fetch('/api/admin/categories?includePostCount=true&includeInactive=true');
      const data = await response.json();
      
      if (data.success) {
        // Get all categories and organize them
        const allCategories = data.data;
        
        // Find subcategories (categories with parent) and populate parent info
        const subcategories = allCategories
          .filter((cat: Category) => {
            // Check if it has a parent (either as string ID or object)
            return cat.parent !== null && cat.parent !== undefined;
          })
          .map((cat: Category) => {
            // Find the parent category
            let parentName = 'Unknown Parent';
            if (typeof cat.parent === 'string') {
              const parent = allCategories.find((p: Category) => p._id === cat.parent);
              parentName = parent ? parent.name : 'Unknown Parent';
            } else if (typeof cat.parent === 'object' && cat.parent !== null) {
              parentName = cat.parent.name;
            }
            
            return {
              ...cat,
              parentName: parentName
            };
          });
        
        // Sort subcategories by parent name, then by subcategory name
        subcategories.sort((a: Category, b: Category) => {
          if (a.parentName !== b.parentName) {
            return a.parentName!.localeCompare(b.parentName!);
          }
          return a.name.localeCompare(b.name);
        });
        
        // Group subcategories by parent
        const groups: {[key: string]: Category[]} = {};
        subcategories.forEach((cat: Category) => {
          const parentName = cat.parentName || 'Unknown';
          if (!groups[parentName]) {
            groups[parentName] = [];
          }
          groups[parentName].push(cat);
        });
        
        console.log('Fetched categories:', allCategories.length);
        console.log('Subcategories found:', subcategories.length);
        console.log('Category groups:', groups);
        
        setCategories(subcategories);
        setCategoryGroups(groups);
        setFilteredGroups(groups);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreatePage = async () => {
    try {
      const response = await fetch('/api/admin/subcategory-pages', {
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
      console.log('=== FRONTEND UPDATE DEBUG ===');
      console.log('Editing Page ID:', editingPage._id);
      console.log('Form Data:', JSON.stringify(formData, null, 2));
      
      const response = await fetch(`/api/admin/subcategory-pages/${editingPage._id}`, {
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
      const response = await fetch(`/api/admin/subcategory-pages/${pageId}`, {
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
      const response = await fetch(`/api/admin/subcategory-pages/${pageId}/toggle-status`, {
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
      isActive: true,
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
      isActive: page.isActive,
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

  const toggleGroup = (parentName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [parentName]: !prev[parentName]
    }));
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredGroups(categoryGroups);
      return;
    }

    const filtered: {[key: string]: Category[]} = {};
    Object.entries(categoryGroups).forEach(([parentName, subcategories]) => {
      const matchingSubcategories = subcategories.filter(cat => 
        cat.name.toLowerCase().includes(query.toLowerCase()) ||
        cat.slug.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchingSubcategories.length > 0) {
        filtered[parentName] = matchingSubcategories;
      }
    });
    
    setFilteredGroups(filtered);
  };

  // Keep groups collapsed by default, only expand when search is active
  useEffect(() => {
    if (searchQuery.trim()) {
      // When searching, expand all groups to show results
      const allExpanded: {[key: string]: boolean} = {};
      Object.keys(filteredGroups).forEach(parentName => {
        allExpanded[parentName] = true;
      });
      setExpandedGroups(allExpanded);
    } else {
      // When not searching, keep all groups collapsed
      setExpandedGroups({});
    }
  }, [searchQuery, filteredGroups]);


  // Select media item
  const selectMediaItem = (mediaItem: MediaAsset) => {
    setFormData({
      ...formData,
      hero: {
        ...formData.hero,
        backgroundImage: mediaItem.url
      }
    });
    setShowMediaLibrary(false);
    toast.success('Background media selected successfully');
  };

  // Filter pages based on active status
  const filteredPages = useMemo(() => {
    if (showOnlyActive) {
      return pages.filter(page => page.isActive);
    }
    return pages;
  }, [pages, showOnlyActive]);

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

      {/* Enhanced Create/Edit Form */}
      {(showCreateForm || editingPage) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <CardTitle>
                {editingPage ? 'Edit Subcategory Page' : 'Create New Subcategory Page'}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {editingPage ? 'Update the page settings and content' : 'Configure your new subcategory page'}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-lg p-1">
                  <TabsTrigger 
                    value="hero" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                  >
                    <Palette className="w-4 h-4" />
                    Hero
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sections" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                  >
                    <Layout className="w-4 h-4" />
                    Sections
                  </TabsTrigger>
                  <TabsTrigger 
                    value="seo" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                  >
                    <Type className="w-4 h-4" />
                    SEO
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fallback" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                  >
                    <Settings className="w-4 h-4" />
                    Fallback
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subcategory" className="text-base font-semibold text-gray-900">
                        Subcategory Selection
                      </Label>
                      
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Search subcategories..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => handleSearch('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Enhanced Category Selector */}
                      <div className="border border-gray-200 rounded-xl shadow-sm bg-white max-h-80 overflow-y-auto">
                        {Object.keys(filteredGroups).length === 0 ? (
                          <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                              <Folder className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No subcategories found</p>
                            <p className="text-sm text-gray-400 mt-1">
                              {searchQuery ? 'Try a different search term' : 'Create subcategories in the Categories section'}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {Object.entries(filteredGroups).map(([parentName, subcategories]) => (
                              <div key={parentName} className="group">
                                {/* Enhanced Parent Category Header */}
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(parentName)}
                                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all duration-200 group-hover:bg-gray-50 cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      {expandedGroups[parentName] ? (
                                        <FolderOpen className="w-5 h-5 text-blue-600" />
                                      ) : (
                                        <Folder className="w-5 h-5 text-gray-500" />
                                      )}
                                      <span className="font-semibold text-gray-900 text-left">{parentName}</span>
                                    </div>
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1"
                                    >
                                      {subcategories.length} {subcategories.length === 1 ? 'subcategory' : 'subcategories'}
                                    </Badge>
                                    {!expandedGroups[parentName] && (
                                      <span className="text-xs text-gray-500 italic">Click to expand</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {expandedGroups[parentName] ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200" />
                                    )}
                                  </div>
                                </button>
                                
                                {/* Enhanced Subcategories with Animation */}
                                <motion.div
                                  initial={false}
                                  animate={{
                                    height: expandedGroups[parentName] ? 'auto' : 0,
                                    opacity: expandedGroups[parentName] ? 1 : 0
                                  }}
                                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                                    {subcategories.map((category, index) => (
                                      <motion.button
                                        key={category._id}
                                        type="button"
                                        onClick={() => setFormData({...formData, subcategory: category._id})}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`w-full flex items-center justify-between p-4 pl-12 hover:bg-white/80 transition-all duration-200 group ${
                                          formData.subcategory === category._id 
                                            ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm' 
                                            : 'hover:shadow-sm'
                                        }`}
                                      >
                                        <div className="flex flex-col items-start gap-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                            {formData.subcategory === category._id && (
                                              <Check className="w-4 h-4 text-blue-600" />
                                            )}
                                          </div>
                                          <span className="text-xs text-gray-500 font-mono">/{category.slug}</span>
                                        </div>
                                        {formData.subcategory === category._id && (
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                            <span className="text-xs text-blue-600 font-medium">Selected</span>
                                          </div>
                                        )}
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced Selected Category Display */}
                      {formData.subcategory && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-blue-900">
                                {categories.find(cat => cat._id === formData.subcategory)?.name}
                              </p>
                              <p className="text-sm text-blue-700">
                                Ready to create page for this subcategory
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
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
                      <Label htmlFor="backgroundImage">Background Media</Label>
                      <div className="space-y-3">
                        {/* Current Media Preview */}
                        {formData.hero.backgroundImage && (
                          <div className="relative group">
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              {formData.hero.backgroundImage.includes('video') || formData.hero.backgroundImage.includes('.mp4') || formData.hero.backgroundImage.includes('.webm') ? (
                                <video 
                                  src={formData.hero.backgroundImage} 
                                  className="w-full h-32 object-cover"
                                  muted
                                  loop
                                />
                              ) : (
                                <img 
                                  src={formData.hero.backgroundImage} 
                                  alt="Background preview"
                                  className="w-full h-32 object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setFormData({
                                    ...formData,
                                    hero: { ...formData.hero, backgroundImage: '' }
                                  })}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Media Library Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMediaLibrary(true)}
                className="w-full"
              >
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.hero.backgroundImage ? 'Change Background Media' : 'Select from Media Library'}
                        </Button>
                        
                        {/* Manual URL Input */}
                        <div className="relative">
                          <Input
                            id="backgroundImage"
                            value={formData.hero.backgroundImage}
                            onChange={(e) => setFormData({
                              ...formData,
                              hero: { ...formData.hero, backgroundImage: e.target.value }
                            })}
                            placeholder="Or enter media URL manually"
                            className="pr-10"
                          />
                          {formData.hero.backgroundImage && (
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                hero: { ...formData.hero, backgroundImage: '' }
                              })}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
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

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {editingPage ? 'Update your subcategory page settings' : 'Configure your new subcategory page'}
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={cancelEditing}
                    className="px-6 py-2 border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingPage ? handleUpdatePage : handleCreatePage}
                    className="bg-[#D2AD3F] hover:bg-[#B8941F] text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPage ? 'Update Page' : 'Create Page'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Subcategory Pages</h2>
          <div className="flex items-center gap-2">
            <Switch
              id="show-only-active"
              checked={showOnlyActive}
              onCheckedChange={setShowOnlyActive}
            />
            <Label htmlFor="show-only-active" className="text-sm text-gray-600">
              Show only active pages
            </Label>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filteredPages.length} of {pages.length} pages
        </div>
      </div>

      {/* Enhanced Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map((page, index) => (
          <motion.div
            key={page._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group"
          >
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[#D2AD3F]"></div>
                      <Badge 
                        variant={page.isActive ? "secondary" : "outline"}
                        className={`${
                          page.isActive 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {page.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-[#D2AD3F] transition-colors">
                      {page.subcategory.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      /{page.subcategory.slug}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(page._id, page.isActive)}
                    className={`h-8 w-8 p-0 rounded-full transition-all ${
                      page.isActive 
                        ? 'hover:bg-red-100 hover:text-red-600' 
                        : 'hover:bg-green-100 hover:text-green-600'
                    }`}
                  >
                    {page.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Hero Section Preview */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Type className="w-4 h-4 text-[#D2AD3F]" />
                    <span className="font-medium text-gray-700">Hero Section</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Title:</span> {page.hero.title || 'Not set'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Palette className="w-4 h-4" />
                      <span>Background: {page.hero.backgroundImage ? '✓ Set' : '✗ Not set'}</span>
                    </div>
                    {page.hero.description && (
                      <div className="text-sm text-gray-500 truncate">
                        {page.hero.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sections Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Layout className="w-4 h-4 text-[#D2AD3F]" />
                    <span>Content Sections</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(page.sections).map(([key, section]) => (
                      <Badge 
                        key={key}
                        variant="outline"
                        className={`text-xs ${
                          section.isEnabled 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {section.title}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(page)}
                    className="flex-1 bg-white hover:bg-[#D2AD3F] hover:text-white hover:border-[#D2AD3F] transition-all"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePage(page._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 max-w-md mx-auto">
            <div className="bg-[#D2AD3F]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Settings className="w-10 h-10 text-[#D2AD3F]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {showOnlyActive ? 'No Active Pages' : 'No Subcategory Pages'}
            </h3>
            <p className="text-gray-600 mb-6">
              {showOnlyActive 
                ? 'All pages are currently inactive. Toggle the filter to see all pages.'
                : 'Create your first subcategory page to get started with dynamic content.'
              }
            </p>
            {!showOnlyActive && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-[#D2AD3F] hover:bg-[#B8941F] text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Page
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={selectMediaItem}
        allowedTypes={['image', 'video']}
      />
    </div>
  );
}
