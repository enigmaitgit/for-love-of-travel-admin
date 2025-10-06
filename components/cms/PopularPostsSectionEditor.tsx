'use client';

import * as React from 'react';
import { X, Eye, Plus, Trash2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopularPostsSection } from '@/lib/validation';
import { MediaLibrary } from './MediaLibrary';
import { deepClean } from '@/lib/utils';

interface PopularPostsSectionEditorProps {
  section: PopularPostsSection;
  onChange: (section: PopularPostsSection) => void;
  onClose: () => void;
}

export function PopularPostsSectionEditor({ section, onChange, onClose }: PopularPostsSectionEditorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [mediaLibraryTarget, setMediaLibraryTarget] = React.useState<'featured' | 'side' | null>(null);
  const [sidePostIndex, setSidePostIndex] = React.useState<number | null>(null);
  const [debounceTimeout, setDebounceTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const hasUnsavedChanges = React.useRef(false);

  // Local state for immediate UI updates
  const [localSection, setLocalSection] = React.useState<PopularPostsSection>(() => ({
    type: 'popular-posts',
    title: section.title || 'Popular Posts',
    description: section.description || '',
    featuredPost: section.featuredPost || undefined,
    sidePosts: Array.isArray(section.sidePosts) ? section.sidePosts : []
  }));

  // Update local state when section prop changes
  React.useEffect(() => {
    console.log('PopularPostsSectionEditor: Section prop changed:', section);
    const newLocalSection = {
      type: 'popular-posts' as const,
      title: section.title || 'Popular Posts',
      description: section.description || '',
      featuredPost: section.featuredPost || undefined,
      sidePosts: Array.isArray(section.sidePosts) ? section.sidePosts : []
    };
    console.log('PopularPostsSectionEditor: Setting new local section:', newLocalSection);
    setLocalSection(newLocalSection);
  }, [section]);

  // Ensure section has proper default values (now using local state)
  const safeSection = React.useMemo(() => localSection, [localSection]);

  // Update function with immediate local state update only (no auto-save)
  const updateSection = React.useCallback((updates: Partial<PopularPostsSection>) => {
    console.log('PopularPostsSectionEditor: updateSection called with:', updates);
    console.log('PopularPostsSectionEditor: Current local section before update:', localSection);
    
    setLocalSection(prev => {
      const newState = { ...prev, ...updates };
      console.log('PopularPostsSectionEditor: new local state after update:', newState);
      hasUnsavedChanges.current = true;
      return newState;
    });
    setIsEditing(true);
  }, [localSection]);

  // Cleanup timeout on unmount only
  React.useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const updateFeaturedPost = (updates: Partial<PopularPostsSection['featuredPost']>) => {
    updateSection({
      featuredPost: localSection.featuredPost 
        ? { ...localSection.featuredPost, ...updates }
        : { 
            title: '',
            excerpt: '',
            imageUrl: '',
            readTime: '',
            publishDate: '',
            category: '',
            ...updates
          }
    });
  };

  const updateSidePost = (index: number, updates: Partial<PopularPostsSection['sidePosts'][0]>) => {
    const sidePosts = localSection.sidePosts;
    const newSidePosts = [...sidePosts];
    newSidePosts[index] = { ...newSidePosts[index], ...updates };
    updateSection({ sidePosts: newSidePosts });
  };

  const addSidePost = () => {
    const newSidePost = {
      title: '',
      excerpt: '',
      imageUrl: '',
      readTime: '',
      publishDate: ''
    };
    const sidePosts = localSection.sidePosts;
    updateSection({
      sidePosts: [...sidePosts, newSidePost]
    });
  };

  const removeSidePost = (index: number) => {
    const sidePosts = localSection.sidePosts;
    const newSidePosts = sidePosts.filter((_, i) => i !== index);
    updateSection({ sidePosts: newSidePosts });
  };

  const handleImageSelect = (asset: { url: string }) => {
    if (mediaLibraryTarget === 'featured') {
      updateFeaturedPost({ imageUrl: asset.url });
    } else if (mediaLibraryTarget === 'side' && sidePostIndex !== null) {
      updateSidePost(sidePostIndex, { imageUrl: asset.url });
    }
    setShowMediaLibrary(false);
    setMediaLibraryTarget(null);
    setSidePostIndex(null);
  };

  // Close WITHOUT saving any pending edits
  const handleClose = () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    hasUnsavedChanges.current = false;
    setIsEditing(false);
    onClose();
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Popular Posts Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-16 bg-white">
            <div className="container max-w-6xl mx-auto px-4">
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Featured Article - Left Side */}
                <div className="lg:col-span-2">
                  <div className="mb-6">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">{safeSection.title}</h2>
                    {safeSection.description && (
                      <p className="text-gray-600">{safeSection.description}</p>
                    )}
                  </div>

                  {safeSection.featuredPost && (
                    <div className="relative w-full h-[500px] overflow-hidden shadow-lg group cursor-pointer rounded-[24px]">
                      {safeSection.featuredPost.imageUrl ? (
                        <img
                          src={safeSection.featuredPost.imageUrl}
                          alt="Featured article"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-[24px]"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-[24px]">
                          <div className="text-center text-muted-foreground">
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <Image className="w-12 h-12 mx-auto mb-2" />
                            <p>No image selected</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-[24px]">
                        <div className="absolute top-6 left-6">
                          <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                            Tours
                          </span>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6">
                          <h3 className="text-3xl font-bold text-white mb-3">
                            {safeSection.featuredPost.title || 'Featured Post Title'}
                          </h3>
                          <p className="text-white/90 mb-4 text-lg">
                            {safeSection.featuredPost.excerpt || 'Featured post excerpt...'}
                          </p>
                          <div className="flex items-center text-white/80 text-sm">
                            <span>{safeSection.featuredPost.readTime || '14 min read'}</span>
                            <span className="mx-2">|</span>
                            <span>{safeSection.featuredPost.publishDate || 'May 28, 2025'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Side Articles - Right Side */}
                <div className="lg:col-span-3 space-y-6">
                  {safeSection.sidePosts.map((post, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="flex h-48 sm:h-56">
                        <div className="relative w-40 h-full flex-shrink-0">
                          {post.imageUrl ? (
                            <img
                              src={post.imageUrl}
                              alt="Article image"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              {/* eslint-disable-next-line jsx-a11y/alt-text */}
                              <Image className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 sm:p-6 flex-1 flex flex-col">
                          <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">
                            {post.title || 'Side Post Title'}
                          </h4>
                          <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2">
                            {post.excerpt || 'Side post excerpt...'}
                          </p>
                          <div className="flex items-center justify-end text-xs sm:text-sm text-gray-500 mt-auto">
                            <span>{post.readTime || '14 min read'}</span>
                            <span className="mx-2">|</span>
                            <span>{post.publishDate || 'May 28, 2025'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle>Popular Posts Editor</CardTitle>
          {isEditing && (
            <div className="flex items-center text-blue-600 text-sm">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              <span>Editing...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Title */}
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input
            value={safeSection.title}
            onChange={(e) => updateSection({ title: e.target.value })}
            placeholder="Popular Posts"
          />
        </div>

        {/* Section Description */}
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            value={safeSection.description}
            onChange={(e) => updateSection({ description: e.target.value })}
            placeholder="Brief description of the popular posts section"
            rows={2}
          />
        </div>

        {/* Featured Post */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Featured Post</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMediaLibraryTarget('featured');
                setShowMediaLibrary(true);
              }}
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-4 h-4 mr-2" />
              Select Image
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={safeSection.featuredPost?.title || ''}
                onChange={(e) => updateFeaturedPost({ title: e.target.value })}
                placeholder="Featured post title"
              />
            </div>
            <div className="space-y-2">
              <Label>Read Time</Label>
              <Input
                value={safeSection.featuredPost?.readTime || ''}
                onChange={(e) => updateFeaturedPost({ readTime: e.target.value })}
                placeholder="14 min read"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Excerpt</Label>
            <Textarea
              value={safeSection.featuredPost?.excerpt || ''}
              onChange={(e) => updateFeaturedPost({ excerpt: e.target.value })}
              placeholder="Featured post excerpt..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Publish Date</Label>
            <Input
              value={safeSection.featuredPost?.publishDate || ''}
              onChange={(e) => updateFeaturedPost({ publishDate: e.target.value })}
              placeholder="May 28, 2025"
            />
          </div>

          {safeSection.featuredPost?.imageUrl && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden border">
              <img
                src={safeSection.featuredPost.imageUrl}
                alt="Featured post preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Side Posts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Side Posts</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSidePost}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Post
            </Button>
          </div>

          <div className="space-y-4">
            {safeSection.sidePosts.map((post, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Side Post {index + 1}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMediaLibraryTarget('side');
                        setSidePostIndex(index);
                        setShowMediaLibrary(true);
                      }}
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSidePost(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={post.title}
                      onChange={(e) => updateSidePost(index, { title: e.target.value })}
                      placeholder="Side post title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Read Time</Label>
                    <Input
                      value={post.readTime}
                      onChange={(e) => updateSidePost(index, { readTime: e.target.value })}
                      placeholder="14 min read"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={post.excerpt}
                    onChange={(e) => updateSidePost(index, { excerpt: e.target.value })}
                    placeholder="Side post excerpt..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Publish Date</Label>
                  <Input
                    value={post.publishDate}
                    onChange={(e) => updateSidePost(index, { publishDate: e.target.value })}
                    placeholder="May 28, 2025"
                  />
                </div>

                {post.imageUrl && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                    <img
                      src={post.imageUrl}
                      alt="Side post preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (debounceTimeout) clearTimeout(debounceTimeout);
              const toSave = deepClean(localSection);
              onChange(toSave);
              hasUnsavedChanges.current = false;
              setIsEditing(false);
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Section
          </Button>
        </div>
      </CardContent>

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => {
          setShowMediaLibrary(false);
          setMediaLibraryTarget(null);
          setSidePostIndex(null);
        }}
        onSelect={handleImageSelect}
      />
    </Card>
  );
}
