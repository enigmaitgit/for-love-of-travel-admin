'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Eye, X, Upload, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContentBuilder } from '@/components/cms/ContentBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentPageSchema } from '@/lib/validation';
import { z } from 'zod';
import { getCurrentUserPermissions } from '@/lib/rbac';
import { ContentSection } from '@/lib/validation';
import { useSnackbar } from '@/components/ui/snackbar';

type ContentPageForm = z.infer<typeof ContentPageSchema>;

export default function NewContentPagePage() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  const [contentSections, setContentSections] = React.useState<ContentSection[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [savedContentPage, setSavedContentPage] = React.useState<ContentPageForm | null>(null);

  const permissions = getCurrentUserPermissions();

  const form = useForm<ContentPageForm>({
    resolver: zodResolver(ContentPageSchema),
    defaultValues: {
      title: '',
      slug: 'content',
      content: '',
      contentSections: [],
      status: 'draft',
      seoTitle: '',
      metaDescription: '',
      featuredImage: '',
      publishedAt: undefined,
      updatedAt: undefined
    }
  });

  const handleContentSectionsChange = (sections: ContentSection[]) => {
    console.log('ContentPageForm: Content sections changed:', sections);
    setContentSections(sections);
    form.setValue('contentSections', sections);
  };

  const handleSaveDraft = async (data: ContentPageForm) => {
    console.log('ContentPageForm: Saving draft with data:', data);
    console.log('ContentPageForm: Content sections:', contentSections);
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        sections: contentSections,
        status: 'draft'
      };
      console.log('ContentPageForm: Payload being sent:', payload);
      
      const response = await fetch('/api/v1/content-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('ContentPageForm: Save draft response:', result);
        setSavedContentPage(result.data);
        showSnackbar('Content page saved as draft successfully!', 'success');
      } else {
        const errorData = await response.json();
        console.error('ContentPageForm: Error saving content page:', errorData);
        showSnackbar(`Failed to save content page: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving content page:', error);
      showSnackbar('Failed to save content page. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (data: ContentPageForm) => {
    if (!savedContentPage) {
      showSnackbar('Please save the content page first before publishing.', 'warning');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/v1/content-pages/${savedContentPage.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showSnackbar('Content page published successfully!', 'success');
        router.push('/layout-1/blog/content-pages');
      } else {
        const errorData = await response.json();
        console.error('Error publishing content page:', errorData.error);
        showSnackbar(`Failed to publish content page: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error publishing content page:', error);
      showSnackbar('Failed to publish content page. Please try again.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSyncToMain = async () => {
    if (!savedContentPage) {
      showSnackbar('Please save the content page first before syncing.', 'warning');
      return;
    }

    console.log('ContentPageForm: Syncing to main website, content page:', savedContentPage);
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/v1/content-pages/${savedContentPage.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('ContentPageForm: Sync response:', result);
        showSnackbar('Content page synced to main website successfully!', 'success');
      } else {
        const errorData = await response.json();
        console.error('ContentPageForm: Error syncing content page:', errorData);
        showSnackbar(`Failed to sync content page: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error syncing content page:', error);
      showSnackbar('Failed to sync content page. Please try again.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePreview = () => {
    if (!savedContentPage) {
      showSnackbar('Please save the content page first before previewing.', 'warning');
      return;
    }
    window.open(`/preview/content-page/${savedContentPage.id}`, '_blank');
  };

  return (
    <div className="space-y-6 ml-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Content Page</h1>
          <p className="text-muted-foreground">
            Build your website content page using the content builder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!savedContentPage}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={form.handleSubmit(handleSaveDraft)}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          {permissions.includes('post:publish') && (
            <Button
              onClick={form.handleSubmit(handlePublish)}
              disabled={isPublishing || !savedContentPage}
            >
              <Globe className="h-4 w-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          {permissions.includes('post:publish') && savedContentPage && (
            <Button
              variant="secondary"
              onClick={handleSyncToMain}
              disabled={isSyncing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isSyncing ? 'Syncing...' : 'Sync to Main'}
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSaveDraft)} className="space-y-6">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content Builder</TabsTrigger>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Builder</CardTitle>
                <CardDescription>
                  Build your content page using drag-and-drop sections. Create hero sections, text blocks, galleries, and more.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentBuilder
                  sections={contentSections}
                  onChange={handleContentSectionsChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set up the basic information for your content page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Slug</label>
                  <Input
                    {...form.register('slug')}
                    placeholder="content"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The URL path for this content page (e.g., /content)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) => form.setValue('status', value as 'draft' | 'published' | 'archived')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Configure search engine optimization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Meta Title</label>
                  <Input
                    {...form.register('seoTitle')}
                    placeholder="Enter meta title"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 50-60 characters
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Meta Description</label>
                  <Textarea
                    {...form.register('metaDescription')}
                    placeholder="Enter meta description"
                    className="w-full"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 150-160 characters
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Keywords</label>
                  <Input
                    placeholder="Enter keywords separated by commas"
                    className="w-full"
                    onChange={(e) => {
                      // SEO keywords not in current schema
                      // const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate keywords with commas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Settings</CardTitle>
                <CardDescription>
                  Additional settings for your content page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Auto-sync to Main Website</h4>
                    <p className="text-xs text-muted-foreground">
                      Automatically sync changes to the main website when published
                    </p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Version Control</h4>
                    <p className="text-xs text-muted-foreground">
                      Keep track of content page versions and changes
                    </p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

