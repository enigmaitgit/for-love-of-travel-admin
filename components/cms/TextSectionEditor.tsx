'use client';

import * as React from 'react';
import { X, Eye, AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette, Zap, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { TextSection } from '@/lib/validation';

interface TextSectionEditorProps {
  section: TextSection;
  onChange: (section: TextSection) => void;
  onClose: () => void;
}

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
  { value: 'justify', label: 'Justify', icon: AlignJustify }
];

const FONT_SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'base', label: 'Base' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' }
];

const FONT_FAMILY_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'serif', label: 'Serif' },
  { value: 'sans', label: 'Sans' },
  { value: 'mono', label: 'Mono' }
];

const LINE_HEIGHT_OPTIONS = [
  { value: 'tight', label: 'Tight' },
  { value: 'snug', label: 'Snug' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'loose', label: 'Loose' }
];

const DROP_CAP_SIZE_OPTIONS = [
  { value: 'text-4xl', label: '4xl' },
  { value: 'text-5xl', label: '5xl' },
  { value: 'text-6xl', label: '6xl' }
];

const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' }
];

const ANIMATION_TYPE_OPTIONS = [
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideInLeft', label: 'Slide In Left' },
  { value: 'slideInRight', label: 'Slide In Right' },
  { value: 'none', label: 'None' }
];

export function TextSectionEditor({ section, onChange, onClose }: TextSectionEditorProps) {
  const [previewMode, setPreviewMode] = React.useState(false);

  // Ensure section has proper default values
  const safeSection = React.useMemo(() => ({
    content: section.content || '',
    hasDropCap: section.hasDropCap ?? false,
    alignment: section.alignment || 'left',
    fontSize: section.fontSize || 'base',
    fontFamily: section.fontFamily || 'inter',
    lineHeight: section.lineHeight || 'relaxed',
    dropCap: section.dropCap || {
      enabled: false,
      size: 'text-4xl',
      color: 'text-gray-900',
      fontWeight: 'semibold',
      float: true
    },
    animation: section.animation || {
      enabled: true,
      type: 'fadeIn',
      duration: 0.3,
      delay: 0.1
    }
  }), [section]);

  const updateSection = (updates: Partial<TextSection>) => {
    onChange({ ...section, ...updates });
  };

  const updateDropCap = (updates: Partial<TextSection['dropCap']>) => {
    updateSection({
      dropCap: { 
        ...safeSection.dropCap, 
        ...updates 
      }
    });
  };

  const updateAnimation = (updates: Partial<TextSection['animation']>) => {
    updateSection({
      animation: { ...safeSection.animation, ...updates }
    });
  };

  const renderPreview = () => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    };

    const fontSizeClasses = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };

    const fontFamilyClasses = {
      inter: 'font-sans',
      serif: 'font-serif',
      sans: 'font-sans',
      mono: 'font-mono'
    };

    const lineHeightClasses = {
      tight: 'leading-tight',
      snug: 'leading-snug',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
      loose: 'leading-loose'
    };

    const fontWeightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    };

    return (
      <div className={cn(
        'prose max-w-none',
        alignmentClasses[safeSection.alignment],
        fontSizeClasses[safeSection.fontSize],
        fontFamilyClasses[safeSection.fontFamily],
        lineHeightClasses[safeSection.lineHeight]
      )}>
        {safeSection.dropCap?.enabled && safeSection.content ? (
          <p className={cn("leading-relaxed", lineHeightClasses[safeSection.lineHeight])}>
            <span className={cn(
              "float-left mr-2 leading-none",
              safeSection.dropCap?.size,
              fontWeightClasses[safeSection.dropCap?.fontWeight],
              safeSection.dropCap?.color
            )}>
              {safeSection.content.charAt(0)}
            </span>
            {safeSection.content.slice(1)}
          </p>
        ) : (
          <p className={cn("leading-relaxed", lineHeightClasses[safeSection.lineHeight])}>
            {safeSection.content || 'Enter your text content here...'}
          </p>
        )}
      </div>
    );
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Text Section Preview</CardTitle>
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
        <CardTitle>Text Section Editor</CardTitle>
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
              <Type className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="dropcap" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Drop Cap
            </TabsTrigger>
            <TabsTrigger value="animation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Animation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-6">
            {/* Content */}
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={safeSection.content}
                onChange={(e) => updateSection({ content: e.target.value })}
                placeholder="Enter your text content here..."
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Alignment */}
            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <div className="flex gap-2">
                {ALIGNMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={safeSection.alignment === value ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => updateSection({ alignment: value as 'left' | 'center' | 'right' | 'justify' })}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label>Live Preview</Label>
              <div className="p-4 border rounded-lg bg-muted/20 max-h-64 overflow-y-auto">
                {renderPreview()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6 mt-6">
            {/* Font Family */}
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={safeSection.fontFamily}
                onValueChange={(value) => updateSection({ fontFamily: value as 'inter' | 'serif' | 'sans' | 'mono' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILY_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select
                value={safeSection.fontSize}
                onValueChange={(value) => updateSection({ fontSize: value as 'sm' | 'base' | 'lg' | 'xl' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <Label>Line Height</Label>
              <Select
                value={safeSection.lineHeight}
                onValueChange={(value) => updateSection({ lineHeight: value as 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_HEIGHT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="dropcap" className="space-y-6 mt-6">
            {/* Enable Drop Cap */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Drop Cap</Label>
                <p className="text-sm text-muted-foreground">
                  Make the first letter larger and floating
                </p>
              </div>
              <Switch
                checked={safeSection.dropCap?.enabled || false}
                onCheckedChange={(checked) => updateDropCap({ enabled: checked })}
              />
            </div>

            {safeSection.dropCap?.enabled && (
              <>
                {/* Drop Cap Size */}
                <div className="space-y-2">
                  <Label>Drop Cap Size</Label>
                  <Select
                    value={safeSection.dropCap?.size || 'text-4xl'}
                    onValueChange={(value) => updateDropCap({ size: value as 'text-4xl' | 'text-5xl' | 'text-6xl' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DROP_CAP_SIZE_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Drop Cap Color */}
                <div className="space-y-2">
                  <Label>Drop Cap Color</Label>
                  <Input
                    value={safeSection.dropCap?.color || 'text-gray-900'}
                    onChange={(e) => updateDropCap({ color: e.target.value })}
                    placeholder="text-gray-900"
                  />
                </div>

                {/* Drop Cap Font Weight */}
                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={safeSection.dropCap?.fontWeight || 'semibold'}
                    onValueChange={(value) => updateDropCap({ fontWeight: value as 'normal' | 'medium' | 'semibold' | 'bold' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_WEIGHT_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Float */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Float Left</Label>
                    <p className="text-sm text-muted-foreground">
                      Float the drop cap to the left
                    </p>
                  </div>
                  <Switch
                    checked={safeSection.dropCap?.float || true}
                    onCheckedChange={(checked) => updateDropCap({ float: checked })}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="animation" className="space-y-6 mt-6">
            {/* Enable Animation */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Enable Animation</Label>
              <Switch
                checked={safeSection.animation.enabled}
                onCheckedChange={(checked) => updateAnimation({ enabled: checked })}
              />
            </div>

            {safeSection.animation.enabled && (
              <>
                {/* Animation Type */}
                <div className="space-y-2">
                  <Label>Animation Type</Label>
                  <Select
                    value={safeSection.animation.type}
                    onValueChange={(value) => updateAnimation({ type: value as 'fadeIn' | 'slideUp' | 'slideInLeft' | 'slideInRight' | 'none' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMATION_TYPE_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>Duration: {safeSection.animation.duration}s</Label>
                  <Slider
                    value={[safeSection.animation.duration]}
                    onValueChange={([value]) => updateAnimation({ duration: value })}
                    max={3}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Delay */}
                <div className="space-y-2">
                  <Label>Delay: {safeSection.animation.delay}s</Label>
                  <Slider
                    value={[safeSection.animation.delay]}
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
    </Card>
  );
}
