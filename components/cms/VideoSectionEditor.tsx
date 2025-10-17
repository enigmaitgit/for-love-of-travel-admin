'use client';

import * as React from 'react';
import { X, Eye, Video, AlignLeft, AlignCenter, AlignRight, Play, Volume2, VolumeX, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { VideoSection } from '@/lib/validation';
import { MediaLibrary } from './MediaLibrary';
import { MediaAsset } from '@/lib/api';
import { getImageDisplayUrl } from '@/lib/image-utils';

interface VideoSectionEditorProps {
  section: VideoSection;
  onChange: (section: VideoSection) => void;
  onClose: () => void;
}

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight }
];

const ANIMATION_TYPES = [
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'scaleIn', label: 'Scale In' },
  { value: 'none', label: 'None' }
];

export function VideoSectionEditor({ section, onChange, onClose }: VideoSectionEditorProps) {
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [showPosterLibrary, setShowPosterLibrary] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [, setMediaAssets] = React.useState<MediaAsset[]>([]);

  // Ensure section has proper default values
  const safeSection = React.useMemo(() => ({
    videoUrl: section.videoUrl || '',
    title: section.title || '',
    description: section.description || '',
    caption: section.caption || '',
    width: section.width,
    alignment: section.alignment || 'center',
    autoplay: section.autoplay ?? false,
    muted: section.muted ?? true,
    loop: section.loop ?? false,
    controls: section.controls ?? true,
    poster: section.poster || '',
    height: section.height || {
      mobile: '60vh',
      tablet: '70vh',
      desktop: '80vh'
    },
    rounded: section.rounded ?? true,
    shadow: section.shadow ?? true,
    animation: section.animation || {
      enabled: true,
      type: 'fadeIn',
      duration: 0.8,
      delay: 0
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
  const resolveVideoUrl = (videoUrl: string | undefined): string => {
    return getImageDisplayUrl(videoUrl || '');
  };

  const updateSection = (updates: Partial<VideoSection>) => {
    onChange({ ...section, ...updates });
  };

  const renderPreview = () => {
    const resolvedVideoUrl = resolveVideoUrl(safeSection.videoUrl);
    const resolvedPosterUrl = safeSection.poster ? getImageDisplayUrl(safeSection.poster) : undefined;
    
    return (
      <div className="relative w-full rounded-lg border">
        {/* Simulated hero section background for preview */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-lg">
          <div className="absolute inset-0 bg-black/30 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold mb-2">This is for the hero section</h1>
              <p className="text-sm opacity-80">Main hero section with parallax effect</p>
            </div>
          </div>
        </div>
        
        {/* Overlapping video content - positioned to overlap main hero section */}
        <div
          className="relative flex items-center justify-center z-20 pointer-events-none"
          style={{
            height: safeSection.height?.desktop || '80vh',
          }}
        >
          <div className="text-center text-white max-w-4xl pointer-events-auto">
            {/* Video player or play button */}
            {resolvedVideoUrl ? (
              <div className="relative inline-block">
                {safeSection.controls ? (
                  <div 
                    className="relative rounded-2xl shadow-2xl overflow-hidden border-2 border-white"
                    style={{
                      width: safeSection.width ? `${safeSection.width}px` : 'min(90vw, 800px)',
                      aspectRatio: '16/9',
                      maxWidth: '100%'
                    }}
                  >
                    <video
                      src={resolvedVideoUrl}
                      poster={resolvedPosterUrl}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay={safeSection.autoplay}
                      muted={safeSection.muted}
                      loop={safeSection.loop}
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <div 
                    className="relative rounded-2xl shadow-2xl overflow-hidden border-2 border-white"
                    style={{
                      width: safeSection.width ? `${safeSection.width}px` : 'min(90vw, 800px)',
                      aspectRatio: '16/9',
                      maxWidth: '100%'
                    }}
                  >
                    {/* Video thumbnail/poster */}
                    {resolvedPosterUrl ? (
                      <img
                        src={resolvedPosterUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Video className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-all duration-300 hover:scale-110 shadow-lg">
                        <Play className="h-8 w-8 text-white ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="relative rounded-2xl shadow-2xl overflow-hidden bg-gray-800 flex items-center justify-center border-2 border-white"
                style={{
                  width: safeSection.width ? `${safeSection.width}px` : 'min(90vw, 800px)',
                  aspectRatio: '16/9',
                  maxWidth: '100%'
                }}
              >
                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full p-6 hover:bg-white/30 transition-all duration-300 mx-auto mb-4">
                    <Video className="h-16 w-16 text-white" />
                  </div>
                  <p className="text-white/80">No video selected</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Caption below the overlapping area */}
        {safeSection.caption && (
          <div className="relative z-30 p-4 bg-white/90 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground italic text-center">
              {safeSection.caption}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Video Section Preview</CardTitle>
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
          <div className="p-6 border rounded-lg bg-muted/20">
            {renderPreview()}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Video Section Editor</CardTitle>
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
      <CardContent className="space-y-6">

        {/* Section Height */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Section Height</Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input
                value={safeSection.height?.mobile || ''}
                onChange={(e) => updateSection({ 
                  height: { 
                    ...safeSection.height, 
                    mobile: e.target.value 
                  } 
                })}
                placeholder="60vh"
              />
            </div>
            <div className="space-y-2">
              <Label>Tablet</Label>
              <Input
                value={safeSection.height?.tablet || ''}
                onChange={(e) => updateSection({ 
                  height: { 
                    ...safeSection.height, 
                    tablet: e.target.value 
                  } 
                })}
                placeholder="70vh"
              />
            </div>
            <div className="space-y-2">
              <Label>Desktop</Label>
              <Input
                value={safeSection.height?.desktop || ''}
                onChange={(e) => updateSection({ 
                  height: { 
                    ...safeSection.height, 
                    desktop: e.target.value 
                  } 
                })}
                placeholder="80vh"
              />
            </div>
          </div>
        </div>

        {/* Video URL */}
        <div className="space-y-2">
          <Label>Video URL</Label>
          <div className="flex items-center gap-2">
            <Input
              value={safeSection.videoUrl}
              onChange={(e) => updateSection({ videoUrl: e.target.value })}
              placeholder="Video URL or select from media library"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMediaLibrary(true)}
            >
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Preview */}
        {(() => {
          const resolvedVideoUrl = resolveVideoUrl(safeSection.videoUrl);
          return resolvedVideoUrl ? (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative w-full max-w-md">
                <video
                  src={resolvedVideoUrl}
                  className="w-full h-auto rounded-lg border"
                  controls
                  muted
                  preload="metadata"
                  onError={(e) => {
                    console.error('Video preview error:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ) : null;
        })()}

        {/* Title */}
        <div className="space-y-2">
          <Label>Title (Optional)</Label>
          <Input
            value={safeSection.title}
            onChange={(e) => updateSection({ title: e.target.value })}
            placeholder="Video title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            value={safeSection.description}
            onChange={(e) => updateSection({ description: e.target.value })}
            placeholder="Video description"
            rows={3}
          />
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label>Caption (Optional)</Label>
          <Input
            value={safeSection.caption}
            onChange={(e) => updateSection({ caption: e.target.value })}
            placeholder="Video caption"
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Width (px)</Label>
            <Input
              type="number"
              value={safeSection.width || ''}
              onChange={(e) => updateSection({ width: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Auto"
            />
          </div>
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={safeSection.height?.desktop || ''}
              onChange={(e) => updateSection({ 
                height: { 
                  ...safeSection.height, 
                  desktop: e.target.value 
                } 
              })}
              placeholder="Auto"
            />
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <Label>Alignment</Label>
          <div className="flex gap-2">
            {ALIGNMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={safeSection.alignment === value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateSection({ alignment: value as 'left' | 'center' | 'right' })}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Video Controls */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Video Controls
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Autoplay
                </Label>
                <p className="text-sm text-muted-foreground">
                  Start playing automatically
                </p>
              </div>
              <Switch
                checked={safeSection.autoplay}
                onCheckedChange={(checked) => updateSection({ autoplay: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  {safeSection.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  Muted
                </Label>
                <p className="text-sm text-muted-foreground">
                  Start without sound
                </p>
              </div>
              <Switch
                checked={safeSection.muted}
                onCheckedChange={(checked) => updateSection({ muted: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Loop
                </Label>
                <p className="text-sm text-muted-foreground">
                  Repeat video continuously
                </p>
              </div>
              <Switch
                checked={safeSection.loop}
                onCheckedChange={(checked) => updateSection({ loop: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Controls</Label>
                <p className="text-sm text-muted-foreground">
                  Display video controls
                </p>
              </div>
              <Switch
                checked={safeSection.controls}
                onCheckedChange={(checked) => updateSection({ controls: checked })}
              />
            </div>
          </div>
        </div>

        {/* Poster Image */}
        <div className="space-y-2">
          <Label>Poster Image (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              value={safeSection.poster}
              onChange={(e) => updateSection({ poster: e.target.value })}
              placeholder="Poster image URL or select from media library"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPosterLibrary(true)}
            >
              <Video className="w-4 h-4" />
            </Button>
          </div>
          {safeSection.poster && (
            <div className="mt-2">
              <img
                src={getImageDisplayUrl(safeSection.poster)}
                alt="Poster preview"
                className="w-32 h-20 object-cover rounded border"
              />
            </div>
          )}
        </div>

        {/* Styling Options */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Styling Options</Label>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Rounded Corners</Label>
              <p className="text-sm text-muted-foreground">
                Add rounded corners to the video
              </p>
            </div>
            <Switch
              checked={safeSection.rounded}
              onCheckedChange={(checked) => updateSection({ rounded: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Drop Shadow</Label>
              <p className="text-sm text-muted-foreground">
                Add a subtle shadow to the video
              </p>
            </div>
            <Switch
              checked={safeSection.shadow}
              onCheckedChange={(checked) => updateSection({ shadow: checked })}
            />
          </div>
        </div>

        {/* Animation Settings */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Animation Settings</Label>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Animation</Label>
              <p className="text-sm text-muted-foreground">
                Add entrance animation to the video
              </p>
            </div>
            <Switch
              checked={safeSection.animation.enabled}
              onCheckedChange={(checked) => updateSection({ 
                animation: { ...safeSection.animation, enabled: checked }
              })}
            />
          </div>

          {safeSection.animation.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label>Animation Type</Label>
                <Select
                  value={safeSection.animation.type}
                  onValueChange={(value) => updateSection({ 
                    animation: { ...safeSection.animation, type: value as 'fadeIn' | 'slideUp' | 'scaleIn' | 'none' }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMATION_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration: {safeSection.animation.duration}s</Label>
                <Slider
                  value={[safeSection.animation.duration || 1]}
                  onValueChange={([value]) => updateSection({ 
                    animation: { ...safeSection.animation, duration: value }
                  })}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Delay: {safeSection.animation.delay}s</Label>
                <Slider
                  value={[safeSection.animation.delay || 0]}
                  onValueChange={([value]) => updateSection({
                    animation: { ...safeSection.animation, delay: value }
                  })}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Live Preview</Label>
          <div className="p-4 border rounded-lg bg-muted/20">
            {renderPreview()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onClose}>
            Save Section
          </Button>
        </div>
      </CardContent>

      {/* Media Library Modal for Video */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(asset) => {
          updateSection({ videoUrl: asset.url });
          setShowMediaLibrary(false);
        }}
        allowedTypes={['video']}
      />

      {/* Media Library Modal for Poster */}
      <MediaLibrary
        isOpen={showPosterLibrary}
        onClose={() => setShowPosterLibrary(false)}
        onSelect={(asset) => {
          updateSection({ poster: asset.url });
          setShowPosterLibrary(false);
        }}
        allowedTypes={['image']}
      />

    </Card>
  );
}

