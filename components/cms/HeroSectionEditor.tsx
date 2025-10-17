'use client';

import * as React from 'react';
import { X, Image, Video, Eye, Share2, Facebook, Twitter, Linkedin, Copy, Settings, Palette, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { HeroSection } from '@/lib/validation';
import { MediaLibrary } from './MediaLibrary';
import { MediaAsset } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-utils';

interface HeroSectionEditorProps {
  section: HeroSection;
  onChange: (section: HeroSection) => void;
  onClose: () => void;
}

export function HeroSectionEditor({ section, onChange, onClose }: HeroSectionEditorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [mediaLibraryType, setMediaLibraryType] = React.useState<'image' | 'video'>('image');
  const [previewMode, setPreviewMode] = React.useState(false);
  const [, setMediaAssets] = React.useState<MediaAsset[]>([]);

  // Ensure section has proper default values
  const safeSection = React.useMemo(() => ({
    backgroundImage: section.backgroundImage ?? '',
    backgroundVideo: section.backgroundVideo ?? '',
    title: section.title ?? '',
    subtitle: section.subtitle ?? '',
    author: section.author ?? '',
    publishDate: section.publishDate ?? '',
    readTime: section.readTime ?? '',
    overlayOpacity: section.overlayOpacity ?? 0.3,
    height: section.height || { mobile: '70vh', tablet: '80vh', desktop: '90vh' },
    titleSize: section.titleSize || { mobile: 'text-3xl', tablet: 'text-5xl', desktop: 'text-6xl' },
    parallaxEnabled: section.parallaxEnabled ?? true,
    parallaxSpeed: section.parallaxSpeed ?? 0.5,
    backgroundPosition: section.backgroundPosition || 'center',
    backgroundSize: section.backgroundSize || 'cover',
    animation: section.animation || {
      enabled: true,
      type: 'fadeIn',
      duration: 0.8,
      delay: 0
    },
    socialSharing: section.socialSharing || {
      enabled: true,
      platforms: ['facebook', 'twitter', 'linkedin', 'copy'],
      position: 'bottom-right',
      style: 'glass'
    }
  }), [section]);

  // Load media assets to resolve IDs to URLs
  React.useEffect(() => {
    const loadMediaAssets = async () => {
      try {
        const response = await fetch('/api/admin/media');
        const responseData = await response.json();
        const data = responseData.data || responseData;
        setMediaAssets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading media assets:', error);
      }
    };
    loadMediaAssets();
  }, []);

  // Helper function to resolve asset ID to URL for display
  const resolveImageUrl = (imageUrl: string | undefined): string => {
    return getImageDisplayUrl(imageUrl || '');
  };

  const updateSection = (updates: Partial<HeroSection>) => {
    onChange({ ...section, ...updates });
  };

  const updateSocialSharing = (updates: Partial<HeroSection['socialSharing']>) => {
    updateSection({
      socialSharing: { ...safeSection.socialSharing, ...updates }
    });
  };

  const updateAnimation = (updates: Partial<HeroSection['animation']>) => {
    updateSection({
      animation: { ...safeSection.animation, ...updates }
    });
  };

  const updateHeight = (device: 'mobile' | 'tablet' | 'desktop', value: string) => {
    updateSection({
      height: { ...safeSection.height, [device]: value }
    });
  };

  const updateTitleSize = (device: 'mobile' | 'tablet' | 'desktop', value: string) => {
    updateSection({
      titleSize: { ...safeSection.titleSize, [device]: value }
    });
  };

  const toggleSocialPlatform = (platform: string) => {
    const platforms = safeSection.socialSharing.platforms;
    const newPlatforms = platforms.includes(platform as 'facebook' | 'twitter' | 'linkedin' | 'copy' | 'share')
      ? platforms.filter(p => p !== platform)
      : [...platforms, platform as 'facebook' | 'twitter' | 'linkedin' | 'copy' | 'share'];
    
    updateSocialSharing({ platforms: newPlatforms });
  };

  if (previewMode) {
    const getSocialIcon = (platform: string) => {
      const icons = {
        facebook: Facebook,
        twitter: Twitter,
        linkedin: Linkedin,
        copy: Copy,
        share: Share2
      };
      return icons[platform as keyof typeof icons] || Share2;
    };

    const getSocialPosition = () => {
      const positions = {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4'
      };
      return positions[safeSection.socialSharing.position] || 'bottom-4 right-4';
    };

    const getSocialStyle = () => {
      const styles = {
        glass: 'bg-white/20 backdrop-blur-sm hover:bg-white/30',
        solid: 'bg-white hover:bg-gray-100',
        outline: 'bg-transparent border border-white/50 hover:bg-white/10'
      };
      return styles[safeSection.socialSharing.style] || 'bg-white/20 backdrop-blur-sm hover:bg-white/30';
    };

    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Hero Section Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="relative rounded-lg overflow-hidden border"
            style={{ 
              height: safeSection.height.desktop,
              minHeight: '400px'
            }}
          >
            {safeSection.backgroundImage ? (
              <img
                src={resolveImageUrl(safeSection.backgroundImage)}
                alt="Hero background"
                className="w-full h-full object-cover"
                style={{
                  objectPosition: safeSection.backgroundPosition,
                  objectFit: safeSection.backgroundSize
                }}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <p>No background image selected</p>
                </div>
              </div>
            )}
            
            {/* Overlay */}
            <div 
              className="absolute inset-0 bg-black"
              style={{ opacity: safeSection.overlayOpacity }}
            />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white max-w-4xl px-4">
                <h1 
                  className={cn(
                    "font-bold mb-4 leading-tight",
                    safeSection.titleSize.mobile,
                    `md:${safeSection.titleSize.tablet}`,
                    `lg:${safeSection.titleSize.desktop}`
                  )}
                >
                  {safeSection.title || 'Hero Title'}
                </h1>
                {safeSection.subtitle && (
                  <p className="text-lg md:text-xl mb-4">
                    {safeSection.subtitle}
                  </p>
                )}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg">
                  {safeSection.author && <span>By {safeSection.author}</span>}
                  {safeSection.publishDate && <span>• {safeSection.publishDate}</span>}
                  {safeSection.readTime && <span>• {safeSection.readTime}</span>}
                </div>
              </div>
            </div>

            {/* Social Sharing */}
            {safeSection.socialSharing.enabled && (
              <div className={cn("absolute flex gap-3", getSocialPosition())}>
                {safeSection.socialSharing.platforms.map((platform) => {
                  const Icon = getSocialIcon(platform);
                  return (
                    <Button
                      key={platform}
                      size="sm"
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        getSocialStyle()
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Hero Section Editor</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="styling" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Styling
            </TabsTrigger>
            <TabsTrigger value="animation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Animation
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-6">
            {/* Background Media */}
            <div className="space-y-6">
              <Label>Background Media</Label>
              
              {/* Background Image */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={safeSection.backgroundImage}
                    onChange={(e) => updateSection({ backgroundImage: e.target.value })}
                    placeholder="Image URL or select from media library"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMediaLibraryType('image');
                      setShowMediaLibrary(true);
                    }}
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                </div>
                {(() => {
                  const resolvedImageUrl = resolveImageUrl(safeSection.backgroundImage);
                  return resolvedImageUrl ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <img
                        src={resolvedImageUrl}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Background Video */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Video</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={safeSection.backgroundVideo}
                    onChange={(e) => updateSection({ backgroundVideo: e.target.value })}
                    placeholder="Video URL or select from media library"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMediaLibraryType('video');
                      setShowMediaLibrary(true);
                    }}
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                </div>
                {(() => {
                  const resolvedVideoUrl = resolveImageUrl(safeSection.backgroundVideo);
                  return resolvedVideoUrl ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <video
                        src={resolvedVideoUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onError={(e) => {
                          console.error('Video preview error:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-black/50 rounded-full p-2">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Hero Title</Label>
              <Input
                value={safeSection.title}
                onChange={(e) => updateSection({ title: e.target.value })}
                placeholder="Enter hero title"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label>Subtitle (Optional)</Label>
              <Input
                value={safeSection.subtitle}
                onChange={(e) => updateSection({ subtitle: e.target.value })}
                placeholder="Enter subtitle"
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={safeSection.author}
                onChange={(e) => updateSection({ author: e.target.value })}
                placeholder="Author name"
              />
            </div>

            {/* Publish Date */}
            <div className="space-y-2">
              <Label>Publish Date</Label>
              <Input
                value={safeSection.publishDate}
                onChange={(e) => updateSection({ publishDate: e.target.value })}
                placeholder="e.g., May 28, 2019"
              />
            </div>

            {/* Read Time */}
            <div className="space-y-2">
              <Label>Read Time</Label>
              <Input
                value={safeSection.readTime}
                onChange={(e) => updateSection({ readTime: e.target.value })}
                placeholder="e.g., 5 min read"
              />
            </div>
          </TabsContent>

          <TabsContent value="styling" className="space-y-6 mt-6">
            {/* Overlay Opacity */}
            <div className="space-y-2">
              <Label>Overlay Opacity: {Math.round((section.overlayOpacity || 0.3) * 100)}%</Label>
              <Slider
                value={[section.overlayOpacity || 0.3]}
                onValueChange={([value]) => updateSection({ overlayOpacity: value })}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Responsive Heights */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Responsive Heights</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Mobile</Label>
                  <Input
                    value={section.height?.mobile || '70vh'}
                    onChange={(e) => updateHeight('mobile', e.target.value)}
                    placeholder="70vh"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Tablet</Label>
                  <Input
                    value={section.height?.tablet || '80vh'}
                    onChange={(e) => updateHeight('tablet', e.target.value)}
                    placeholder="80vh"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Desktop</Label>
                  <Input
                    value={section.height?.desktop || '90vh'}
                    onChange={(e) => updateHeight('desktop', e.target.value)}
                    placeholder="90vh"
                  />
                </div>
              </div>
            </div>

            {/* Title Sizes */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Title Sizes</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Mobile</Label>
                  <Select
                    value={section.titleSize?.mobile || 'text-2xl'}
                    onValueChange={(value) => updateTitleSize('mobile', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-2xl">2xl</SelectItem>
                      <SelectItem value="text-3xl">3xl</SelectItem>
                      <SelectItem value="text-4xl">4xl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Tablet</Label>
                  <Select
                    value={section.titleSize?.tablet || 'text-3xl'}
                    onValueChange={(value) => updateTitleSize('tablet', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-4xl">4xl</SelectItem>
                      <SelectItem value="text-5xl">5xl</SelectItem>
                      <SelectItem value="text-6xl">6xl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Desktop</Label>
                  <Select
                    value={section.titleSize?.desktop || 'text-4xl'}
                    onValueChange={(value) => updateTitleSize('desktop', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-5xl">5xl</SelectItem>
                      <SelectItem value="text-6xl">6xl</SelectItem>
                      <SelectItem value="text-7xl">7xl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Background Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Background Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={section.backgroundPosition}
                    onValueChange={(value) => updateSection({ backgroundPosition: value as 'center' | 'top' | 'bottom' | 'left' | 'right' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select
                    value={section.backgroundSize}
                    onValueChange={(value) => updateSection({ backgroundSize: value as 'cover' | 'contain' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="contain">Contain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Parallax Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Parallax Effect</Label>
                <Switch
                  checked={section.parallaxEnabled}
                  onCheckedChange={(checked) => updateSection({ parallaxEnabled: checked })}
                />
              </div>
              {section.parallaxEnabled && (
                <div className="space-y-2">
                  <Label>Parallax Speed: {section.parallaxSpeed || 1}</Label>
                  <Slider
                    value={[section.parallaxSpeed || 1]}
                    onValueChange={([value]) => updateSection({ parallaxSpeed: value })}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="animation" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Enable Animation</Label>
              <Switch
                checked={section.animation?.enabled || false}
                onCheckedChange={(checked) => updateAnimation({ enabled: checked })}
              />
            </div>

            {section.animation?.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Animation Type</Label>
                  <Select
                    value={section.animation?.type || 'fadeIn'}
                    onValueChange={(value) => updateAnimation({ type: value as 'fadeIn' | 'slideUp' | 'scaleIn' | 'none' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fadeIn">Fade In</SelectItem>
                      <SelectItem value="slideUp">Slide Up</SelectItem>
                      <SelectItem value="scaleIn">Scale In</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration: {section.animation?.duration || 0.5}s</Label>
                  <Slider
                    value={[section.animation?.duration || 0.5]}
                    onValueChange={([value]) => updateAnimation({ duration: value })}
                    max={3}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delay: {section.animation?.delay || 0}s</Label>
                  <Slider
                    value={[section.animation?.delay || 0]}
                    onValueChange={([value]) => updateAnimation({ delay: value })}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="social" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Enable Social Sharing</Label>
              <Switch
                checked={section.socialSharing?.enabled || false}
                onCheckedChange={(checked) => updateSocialSharing({ enabled: checked })}
              />
            </div>
            
            {section.socialSharing?.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={section.socialSharing?.position || 'bottom-right'}
                    onValueChange={(value) => updateSocialSharing({ position: value as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select
                    value={section.socialSharing?.style || 'glass'}
                    onValueChange={(value) => updateSocialSharing({ style: value as 'glass' | 'solid' | 'outline' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="glass">Glass</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Platforms</Label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { key: 'facebook', label: 'Facebook', icon: Facebook },
                      { key: 'twitter', label: 'Twitter', icon: Twitter },
                      { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                      { key: 'copy', label: 'Copy Link', icon: Copy },
                      { key: 'share', label: 'Share', icon: Share2 }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={section.socialSharing?.platforms?.includes(key as 'facebook' | 'twitter' | 'linkedin' | 'copy' | 'share') || false}
                          onCheckedChange={() => toggleSocialPlatform(key)}
                        />
                        <Label htmlFor={key} className="flex items-center gap-2 text-sm">
                          <Icon className="w-4 h-4" />
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onClose}>
            Save Section
          </Button>
        </div>
      </CardContent>

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(asset) => {
          // Store the asset URL for proper media rendering
          if (mediaLibraryType === 'video') {
            updateSection({ backgroundVideo: asset.url });
          } else {
            updateSection({ backgroundImage: asset.url });
          }
          setShowMediaLibrary(false);
        }}
        allowedTypes={mediaLibraryType === 'video' ? ['video'] : ['image']}
      />
    </Card>
  );
}
