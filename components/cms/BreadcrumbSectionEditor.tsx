'use client';

import * as React from 'react';
import { X, Plus, Trash2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BreadcrumbSection } from '@/lib/validation';

interface BreadcrumbSectionEditorProps {
  section: BreadcrumbSection;
  onChange: (section: BreadcrumbSection) => void;
  onClose: () => void;
}

export function BreadcrumbSectionEditor({ section, onChange, onClose }: BreadcrumbSectionEditorProps) {
  const [previewMode, setPreviewMode] = React.useState(false);

  // Ensure section has proper default values
  const safeSection = React.useMemo(() => ({
    enabled: section.enabled ?? true,
    items: Array.isArray(section.items) ? section.items : [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '#destinations' }
    ],
    style: section.style || {
      separator: '>',
      textSize: 'sm',
      showHomeIcon: false,
      color: 'gray'
    }
  }), [section]);

  const updateSection = (updates: Partial<BreadcrumbSection>) => {
    onChange({ ...section, ...updates });
  };

  const updateStyle = (updates: Partial<BreadcrumbSection['style']>) => {
    updateSection({
      style: { ...safeSection.style, ...updates }
    });
  };

  const addBreadcrumbItem = () => {
    const newItems = [...safeSection.items, { label: 'New Item', href: '' }];
    updateSection({ items: newItems });
  };

  const updateBreadcrumbItem = (index: number, updates: Partial<{ label: string; href: string }>) => {
    const newItems = safeSection.items.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    );
    updateSection({ items: newItems });
  };

  const removeBreadcrumbItem = (index: number) => {
    if (safeSection.items.length > 1) {
      const newItems = safeSection.items.filter((_, i) => i !== index);
      updateSection({ items: newItems });
    }
  };

  const getSeparatorIcon = () => {
    const separators = {
      '>': '>',
      '→': '→',
      '|': '|',
      '/': '/'
    };
    return separators[safeSection.style.separator] || '>';
  };

  const getTextSizeClass = () => {
    const sizes = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg'
    };
    return sizes[safeSection.style.textSize] || 'text-sm';
  };

  const getColorClass = () => {
    const colors = {
      gray: 'text-gray-500 hover:text-gray-700',
      blue: 'text-blue-500 hover:text-blue-700',
      black: 'text-gray-900 hover:text-gray-700'
    };
    return colors[safeSection.style.color] || 'text-gray-500 hover:text-gray-700';
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Breadcrumb Preview</CardTitle>
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
          <div className="py-4 bg-white">
            <div className="container max-w-6xl mx-auto px-4">
              <nav className={cn("flex items-center space-x-2", getTextSizeClass())}>
                {safeSection.items.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className={cn("text-gray-400", getTextSizeClass())}>
                        {getSeparatorIcon()}
                      </span>
                    )}
                    {item.href ? (
                      <a 
                        href={item.href} 
                        className={cn("transition-colors", getColorClass())}
                      >
                        {index === 0 && safeSection.style.showHomeIcon && (
                          <Home className="w-4 h-4 inline mr-1" />
                        )}
                        {item.label}
                      </a>
                    ) : (
                      <span className={cn(
                        index === safeSection.items.length - 1 ? "text-gray-900 font-medium" : getColorClass()
                      )}>
                        {index === 0 && safeSection.style.showHomeIcon && (
                          <Home className="w-4 h-4 inline mr-1" />
                        )}
                        {item.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Breadcrumb Editor</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(true)}
          >
            <X className="w-4 h-4 mr-2" />
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
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Enable Breadcrumb</Label>
          <Switch
            checked={safeSection.enabled}
            onCheckedChange={(checked) => updateSection({ enabled: checked })}
          />
        </div>

        {safeSection.enabled && (
          <>
            {/* Breadcrumb Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Breadcrumb Items</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBreadcrumbItem}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {safeSection.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm">Label</Label>
                        <Input
                          value={item.label}
                          onChange={(e) => updateBreadcrumbItem(index, { label: e.target.value })}
                          placeholder="Item label"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">URL (Optional)</Label>
                        <Input
                          value={item.href || ''}
                          onChange={(e) => updateBreadcrumbItem(index, { href: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeBreadcrumbItem(index)}
                      disabled={safeSection.items.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Styling Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Styling Options</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Separator</Label>
                  <Select
                    value={safeSection.style.separator}
                    onValueChange={(value) => updateStyle({ separator: value as '>' | '→' | '|' | '/' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">">Greater than (&gt;)</SelectItem>
                      <SelectItem value="→">Arrow (→)</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                      <SelectItem value="/">Slash (/)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Text Size</Label>
                  <Select
                    value={safeSection.style.textSize}
                    onValueChange={(value) => updateStyle({ textSize: value as 'sm' | 'base' | 'lg' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select
                    value={safeSection.style.color}
                    onValueChange={(value) => updateStyle({ color: value as 'gray' | 'blue' | 'black' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gray">Gray</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Home Icon</Label>
                  <Switch
                    checked={safeSection.style.showHomeIcon}
                    onCheckedChange={(checked) => updateStyle({ showHomeIcon: checked })}
                  />
                </div>
              </div>
            </div>
          </>
        )}

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
    </Card>
  );
}
