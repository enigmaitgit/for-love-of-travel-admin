'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Save, Eye, Upload, Image as ImageIcon, Type, Palette, Settings, Play, Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSnackbar } from '@/components/ui/snackbar';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
import type { MediaAsset } from '@/lib/api';
import { getBackendUrl } from '@/lib/api-config';

interface HeroSection {
  _id?: string;
  title: string;
  description?: string;
  isActive: boolean;
  content: {
    hero: {
      title: string;
      subtitle?: string;
      backgroundImage: string;
      backgroundVideo?: string;
      searchPlaceholder: string;
      showSearch: boolean;
      showPlayButton: boolean;
      showBoostButton: boolean;
      overlayOpacity: number;
      titleColor: string;
      titleSize: string;
      titleWeight: string;
      textAlignment: 'left' | 'center' | 'right';
      height: string;
      borderRadius: string;
    };
  };
  displaySettings: {
    showTitle: boolean;
    showDescription: boolean;
  };
  styling: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    padding?: string;
    margin?: string;
  };
}

export default function HeroSectionManager() {
  const { showSnackbar } = useSnackbar();
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  useEffect(() => {
    fetchHeroSection();
  }, []);

  const fetchHeroSection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getBackendUrl('api/v1/homepage-content/hero?includeInactive=true'), { cache: 'no-store', credentials: 'include' });
      const data = await response.json();
      
      if (data.success && data.data) {
        setHeroSection(data.data);
      } else {
        // Create default hero section if none exists
        const defaultHero: HeroSection = {
          title: 'Hero Section',
          description: 'Main hero section of the homepage',
          isActive: true,
          content: {
            hero: {
              title: 'Beyond the Horizon Stories That Move You',
              subtitle: '',
              backgroundImage: '/images/balloon4to.png',
              backgroundVideo: '',
              searchPlaceholder: 'Search Blog Post',
              showSearch: true,
              showPlayButton: true,
              showBoostButton: true,
              overlayOpacity: 0.5,
              titleColor: '#ffffff',
              titleSize: '74px',
              titleWeight: '600',
              textAlignment: 'center',
              height: '100vh',
              borderRadius: '86px'
            }
          },
          displaySettings: {
            showTitle: true,
            showDescription: true
          },
          styling: {
            backgroundColor: '',
            textColor: '#ffffff',
            accentColor: '#3514EE',
            padding: 'py-12',
            margin: 'mb-8'
          }
        };
        setHeroSection(defaultHero);
      }
    } catch (err) {
      console.error('Error fetching hero section:', err);
      setError('Failed to load hero section');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!heroSection) return;
    
    try {
      setSaving(true);
      setError(null);

      // Backend expects { hero: { ... } } at the top-level, not nested under content
      const payload = {
        title: heroSection.title,
        description: heroSection.description,
        isActive: heroSection.isActive,
        hero: heroSection.content.hero,
        displaySettings: heroSection.displaySettings,
        styling: heroSection.styling,
      };
      
      const response = await fetch(getBackendUrl('api/v1/homepage-content/hero'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Immediately re-fetch to ensure we read what the server saved
        await fetchHeroSection();
        showSnackbar('Hero section saved successfully!', 'success');
      } else {
        setError(data.message || 'Failed to save hero section');
        showSnackbar('Failed to save hero section', 'error');
      }
    } catch (err) {
      console.error('Error saving hero section:', err);
      setError('Failed to save hero section');
      showSnackbar('Failed to save hero section', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload the file to your server
      // For now, we'll just use a placeholder URL
      const imageUrl = URL.createObjectURL(file);
      setHeroSection(prev => prev ? {
        ...prev,
        content: {
          ...prev.content,
          hero: {
            ...prev.content.hero,
            backgroundImage: imageUrl
          }
        }
      } : null);
    }
  };

  const handleBackgroundFromLibrary = (asset: MediaAsset) => {
    updateHeroContent({ backgroundImage: asset.url });
    setShowMediaLibrary(false);
  };

  const updateHeroContent = (updates: Partial<HeroSection['content']['hero']>) => {
    if (!heroSection) return;
    
    setHeroSection(prev => prev ? {
      ...prev,
      content: {
        ...prev.content,
        hero: {
          ...prev.content.hero,
          ...updates
        }
      }
    } : null);
  };

  const updateDisplaySettings = (updates: Partial<HeroSection['displaySettings']>) => {
    if (!heroSection) return;
    
    setHeroSection(prev => prev ? {
      ...prev,
      displaySettings: {
        ...prev.displaySettings,
        ...updates
      }
    } : null);
  };

  const updateStyling = (updates: Partial<HeroSection['styling']>) => {
    if (!heroSection) return;
    
    setHeroSection(prev => prev ? {
      ...prev,
      styling: {
        ...prev.styling,
        ...updates
      }
    } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!heroSection) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Hero Section Not Found</h3>
            <p className="text-gray-600 mb-6">Unable to load the hero section configuration.</p>
            <Button onClick={fetchHeroSection}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">Hero Section Manager</h1>
              <p className="text-gray-600">Customize your homepage hero section with images, text, and styling</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
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

            <div className="space-y-8">
              {/* Configuration Panel */}
              <div className="space-y-6">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="styling">Styling</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Text Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="hero-title">Main Title</Label>
                      <Textarea
                        id="hero-title"
                        value={heroSection.content.hero.title}
                        onChange={(e) => updateHeroContent({ title: e.target.value })}
                        placeholder="Enter your hero title"
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hero-subtitle">Subtitle (Optional)</Label>
                      <Input
                        id="hero-subtitle"
                        value={heroSection.content.hero.subtitle || ''}
                        onChange={(e) => updateHeroContent({ subtitle: e.target.value })}
                        placeholder="Enter subtitle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-placeholder">Search Placeholder</Label>
                      <Input
                        id="search-placeholder"
                        value={heroSection.content.hero.searchPlaceholder}
                        onChange={(e) => updateHeroContent({ searchPlaceholder: e.target.value })}
                        placeholder="Search placeholder text"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Background Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="background-image">Background Image</Label>
                      <div className="flex gap-2">
                        <Input
                          id="background-image"
                          value={heroSection.content.hero.backgroundImage}
                          onChange={(e) => updateHeroContent({ backgroundImage: e.target.value })}
                          placeholder="Image URL or path"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setShowMediaLibrary(true)}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="background-video">Background Video (Optional)</Label>
                      <Input
                        id="background-video"
                        value={heroSection.content.hero.backgroundVideo || ''}
                        onChange={(e) => updateHeroContent({ backgroundVideo: e.target.value })}
                        placeholder="Video URL or path"
                      />
                    </div>
                    {heroSection.content.hero.backgroundImage && (
                      <div className="mt-4">
                        <img
                          src={heroSection.content.hero.backgroundImage}
                          alt="Background preview"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="styling" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Typography & Colors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title-color">Title Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="title-color"
                            type="color"
                            value={heroSection.content.hero.titleColor}
                            onChange={(e) => updateHeroContent({ titleColor: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={heroSection.content.hero.titleColor}
                            onChange={(e) => updateHeroContent({ titleColor: e.target.value })}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="title-size">Title Size</Label>
                        <Select
                          value={heroSection.content.hero.titleSize}
                          onValueChange={(value) => updateHeroContent({ titleSize: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="48px">48px</SelectItem>
                            <SelectItem value="56px">56px</SelectItem>
                            <SelectItem value="64px">64px</SelectItem>
                            <SelectItem value="74px">74px</SelectItem>
                            <SelectItem value="84px">84px</SelectItem>
                            <SelectItem value="96px">96px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title-weight">Title Weight</Label>
                        <Select
                          value={heroSection.content.hero.titleWeight}
                          onValueChange={(value) => updateHeroContent({ titleWeight: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="400">Normal</SelectItem>
                            <SelectItem value="500">Medium</SelectItem>
                            <SelectItem value="600">Semi Bold</SelectItem>
                            <SelectItem value="700">Bold</SelectItem>
                            <SelectItem value="800">Extra Bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="text-alignment">Text Alignment</Label>
                        <Select
                          value={heroSection.content.hero.textAlignment}
                          onValueChange={(value: 'left' | 'center' | 'right') => updateHeroContent({ textAlignment: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="overlay-opacity">Overlay Opacity: {heroSection.content.hero.overlayOpacity}</Label>
                      <Slider
                        id="overlay-opacity"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[heroSection.content.hero.overlayOpacity]}
                        onValueChange={([value]) => updateHeroContent({ overlayOpacity: value })}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Layout & Dimensions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="height">Height</Label>
                        <Select
                          value={heroSection.content.hero.height}
                          onValueChange={(value) => updateHeroContent({ height: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50vh">50vh</SelectItem>
                            <SelectItem value="75vh">75vh</SelectItem>
                            <SelectItem value="100vh">100vh</SelectItem>
                            <SelectItem value="120vh">120vh</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="border-radius">Border Radius</Label>
                        <Select
                          value={heroSection.content.hero.borderRadius}
                          onValueChange={(value) => updateHeroContent({ borderRadius: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0px">None</SelectItem>
                            <SelectItem value="24px">Small</SelectItem>
                            <SelectItem value="48px">Medium</SelectItem>
                            <SelectItem value="86px">Large</SelectItem>
                            <SelectItem value="120px">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Interactive Elements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Search Bar</Label>
                        <p className="text-sm text-gray-500">Display the search input field</p>
                      </div>
                      <Switch
                        checked={heroSection.content.hero.showSearch}
                        onCheckedChange={(checked) => updateHeroContent({ showSearch: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Play Button</Label>
                        <p className="text-sm text-gray-500">Display the play button in bottom right</p>
                      </div>
                      <Switch
                        checked={heroSection.content.hero.showPlayButton}
                        onCheckedChange={(checked) => updateHeroContent({ showPlayButton: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Boost Button</Label>
                        <p className="text-sm text-gray-500">Display the boost button in bottom right</p>
                      </div>
                      <Switch
                        checked={heroSection.content.hero.showBoostButton}
                        onCheckedChange={(checked) => updateHeroContent({ showBoostButton: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Section Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Active</Label>
                        <p className="text-sm text-gray-500">Enable or disable this hero section</p>
                      </div>
                      <Switch
                        checked={heroSection.isActive}
                        onCheckedChange={(checked) => setHeroSection(prev => prev ? { ...prev, isActive: checked } : null)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="display" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Display Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Title</Label>
                        <p className="text-sm text-gray-500">Display the section title in admin</p>
                      </div>
                      <Switch
                        checked={heroSection.displaySettings.showTitle}
                        onCheckedChange={(checked) => updateDisplaySettings({ showTitle: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Description</Label>
                        <p className="text-sm text-gray-500">Display the section description in admin</p>
                      </div>
                      <Switch
                        checked={heroSection.displaySettings.showDescription}
                        onCheckedChange={(checked) => updateDisplaySettings({ showDescription: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              </Tabs>
              </div>

              {/* Preview Panel */}
              <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div
                    className="relative overflow-hidden"
                    style={{
                      height: heroSection.content.hero.height,
                      borderBottomRightRadius: heroSection.content.hero.borderRadius,
                      borderBottomLeftRadius: heroSection.content.hero.borderRadius
                    }}
                  >
                    {heroSection.content.hero.backgroundImage && (
                      <img
                        src={heroSection.content.hero.backgroundImage}
                        alt="Hero background"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Overlay */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, rgba(0,0,0,${heroSection.content.hero.overlayOpacity}), rgba(0,0,0,${heroSection.content.hero.overlayOpacity * 0.4}), rgba(0,0,0,${heroSection.content.hero.overlayOpacity * 0.2}))`
                      }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <h1 
                        className="max-w-6xl text-white drop-shadow-md"
                        style={{
                          fontFamily: 'var(--font-roboto)',
                          fontWeight: parseInt(heroSection.content.hero.titleWeight),
                          fontSize: heroSection.content.hero.titleSize,
                          lineHeight: heroSection.content.hero.titleSize,
                          color: heroSection.content.hero.titleColor,
                          textAlign: heroSection.content.hero.textAlignment
                        }}
                      >
                        {heroSection.content.hero.title}
                      </h1>

                      {heroSection.content.hero.subtitle && (
                        <p className="mt-4 text-white text-lg opacity-90">
                          {heroSection.content.hero.subtitle}
                        </p>
                      )}

                      {/* Search Bar */}
                      {heroSection.content.hero.showSearch && (
                        <div className="mt-6 w-full flex justify-center relative">
                          <div className="w-full max-w-md h-12 bg-white/20 backdrop-blur-sm border border-white/35 rounded-xl flex items-center px-4">
                            <Search className="h-5 w-5 text-white/80 mr-3" />
                            <input
                              type="text"
                              placeholder={heroSection.content.hero.searchPlaceholder}
                              className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/70"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-6 right-6 flex gap-3">
                      {heroSection.content.hero.showPlayButton && (
                        <button className="w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/35 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {heroSection.content.hero.showBoostButton && (
                        <button className="w-12 h-12 bg-white/25 backdrop-blur-sm border border-white/35 rounded-full flex items-center justify-center text-white hover:bg-white/35 transition-colors">
                          <Zap className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
        {/* Media Library Modal for selecting background image */}
        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleBackgroundFromLibrary}
          allowedTypes={['image']}
        />
      </div>
    </div>
  );
}
