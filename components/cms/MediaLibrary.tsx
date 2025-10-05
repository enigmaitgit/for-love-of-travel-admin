'use client';

import * as React from 'react';
import { Image, Video, File, Upload, X, Trash2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useSnackbar } from '@/components/ui/snackbar';
import { cn } from '@/lib/utils';
import { MediaAsset } from '@/lib/api-client';

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  selectedAssetId?: string;
}

export function MediaLibrary({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedAssetId 
}: MediaLibraryProps) {
  const { showSnackbar } = useSnackbar();
  const [mediaAssets, setMediaAssets] = React.useState<MediaAsset[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = React.useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = React.useState(false);
  const [showDeleteIndividualModal, setShowDeleteIndividualModal] = React.useState(false);
  const [assetToDelete, setAssetToDelete] = React.useState<MediaAsset | null>(null);

  // Load media assets
  React.useEffect(() => {
    if (isOpen) {
      loadMediaAssets();
    }
  }, [isOpen]);

  // Add timeout to prevent infinite loading
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        if (loading) {
          console.warn('Media loading timeout - setting loading to false');
          setLoading(false);
          showSnackbar('Media loading timed out. Please try again.', 'error');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, showSnackbar]);

  const loadMediaAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/media');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      console.log('First asset sample:', data[0]);
      
      // Transform the data to match MediaAsset interface
      const transformedAssets: MediaAsset[] = data.map((asset: any) => {
        console.log('Transforming asset:', asset);
        
        // Determine if it's an image based on type field or mimeType
        const isImage = asset.type === 'image' || asset.mimeType?.startsWith('image/');
        
        // Ensure URL is absolute
        let imageUrl = asset.url;
        if (imageUrl && imageUrl.startsWith('/uploads/')) {
          // If it's a relative path, make it absolute
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${imageUrl}`;
        }
        
        return {
          id: asset._id || asset.id,
          _id: asset._id,
          filename: asset.filename,
          originalName: asset.originalName,
          mimeType: asset.mimeType || (isImage ? 'image/jpeg' : 'video/mp4'), // fallback
          size: asset.size || 0,
          url: imageUrl,
          alt: asset.alt,
          caption: asset.caption,
          uploadedAt: new Date(asset.createdAt || asset.uploadedAt),
          // Add a custom property to track if it's an image
          isImage: isImage
        };
      });
      
      console.log('Transformed assets:', transformedAssets);
      setMediaAssets(transformedAssets);
    } catch (error) {
      console.error('Error loading media:', error);
      showSnackbar('Failed to load media library. Please try again.', 'error');
      setMediaAssets([]); // Set empty array to prevent loading state
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload JPG, PNG, GIF, MP4, or WebM files.');
      return;
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 25MB.');
      return;
    }

    setUploading(true);
    try {
      // Upload to storage first to get hosted URL
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API upload failed:', errorData);
        throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('API upload successful:', result);

      if (result.success && result.data) {
        // Determine if it's an image
        const isImage = result.data.type === 'image' || result.data.mimeType?.startsWith('image/');
        
        // Ensure URL is absolute
        let imageUrl = result.data.url;
        if (imageUrl && imageUrl.startsWith('/uploads/')) {
          // If it's a relative path, make it absolute
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${imageUrl}`;
        }
        
        // Transform the uploaded asset to match MediaAsset interface
        const newAsset: MediaAsset = {
          id: result.data._id || result.data.id,
          _id: result.data._id,
          url: imageUrl,
          originalName: result.data.originalName,
          mimeType: result.data.mimeType,
          size: result.data.size,
          filename: result.data.filename,
          alt: result.data.alt,
          caption: result.data.caption,
          uploadedAt: new Date(result.data.createdAt || result.data.uploadedAt),
          // Add a custom property to track if it's an image
          isImage: isImage
        } as any;

        console.log('Created new asset with hosted URL:', newAsset);

        // Add to local state
        setMediaAssets(prev => [newAsset, ...prev]);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedAssetId) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/media?action=delete&id=${selectedAssetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMediaAssets(prev => prev.filter(asset => asset.id !== selectedAssetId));
        setShowDeleteSelectedModal(false);
        showSnackbar('Media asset deleted successfully', 'success');
        // Refresh the media assets list to ensure consistency
        await loadMediaAssets();
      } else {
        const error = await response.json();
        showSnackbar(`Failed to delete media asset: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting media asset:', error);
      showSnackbar('Failed to delete media asset. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const response = await fetch('/api/admin/media?action=delete-all', {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        setMediaAssets([]);
        setShowDeleteAllModal(false);
        showSnackbar(`Successfully deleted ${result.count} media assets`, 'success');
        // Refresh the media assets list to ensure consistency
        await loadMediaAssets();
      } else {
        const error = await response.json();
        showSnackbar(`Failed to delete all media assets: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting all media assets:', error);
      showSnackbar('Failed to delete all media assets. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteIndividual = async () => {
    if (!assetToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/media?action=delete&id=${assetToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMediaAssets(prev => prev.filter(asset => asset.id !== assetToDelete.id));
        setShowDeleteIndividualModal(false);
        setAssetToDelete(null);
        showSnackbar('Media asset deleted successfully', 'success');
        // Refresh the media assets list to ensure consistency
        await loadMediaAssets();
      } else {
        const error = await response.json();
        showSnackbar(`Failed to delete media asset: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting media asset:', error);
      showSnackbar('Failed to delete media asset. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteIndividualModal = (asset: MediaAsset, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card selection
    setAssetToDelete(asset);
    setShowDeleteIndividualModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        
        {/* Upload Section */}
        <div className="px-6 pb-4 border-b">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-48">
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="file"
                  id="media-upload"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </form>
              <label htmlFor="media-upload">
                <Button
                  asChild
                  disabled={uploading}
                  className="w-full"
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload New Media'}
                  </span>
                </Button>
              </label>
            </div>
            <Button
              onClick={loadMediaAssets}
              variant="outline"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            {selectedAssetId && (
              <Button
                onClick={() => setShowDeleteSelectedModal(true)}
                variant="outline"
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected
              </Button>
            )}
            {mediaAssets.length > 0 && (
              <Button
                onClick={() => setShowDeleteAllModal(true)}
                variant="outline"
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading media...</div>
            </div>
          ) : mediaAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <File className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No media files
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload some files to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaAssets.map((asset) => {
                const isSelected = selectedAssetId === asset.id;
                const isImage = (asset as any).isImage || asset.mimeType?.startsWith('image/');
                const Icon = isImage ? Image : Video;

                return (
                  <Card
                    key={asset.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:shadow-md group',
                      isSelected 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:shadow-md'
                    )}
                    onClick={() => onSelect(asset)}
                  >
                    <CardContent className="p-0">
                      {/* Preview */}
                      <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden relative">
                        {isImage ? (
                          <img
                            src={asset.url}
                            alt={asset.filename}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onLoad={() => console.log('Image loaded successfully:', asset.filename)}
                            onError={(e) => {
                              console.error('Image failed to load:', asset.filename, asset.url);
                              // Fallback for broken images
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="flex flex-col items-center justify-center text-muted-foreground">
                                    <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="text-xs">Image</span>
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Video className="h-8 w-8 mb-2" />
                            <span className="text-xs">Video</span>
                          </div>
                        )}
                        
                        {/* Delete button - top left corner */}
                        <button
                          onClick={(e) => openDeleteIndividualModal(asset, e)}
                          className="absolute top-2 left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                          disabled={deleting}
                          title="Delete this media asset"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        
                        {/* Selection indicator - top right corner */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate" title={asset.filename}>
                            {asset.filename}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {asset.size ? (asset.size / 1024 / 1024).toFixed(1) : '0.0'} MB
                        </p>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs w-fit">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showDeleteSelectedModal}
        onClose={() => setShowDeleteSelectedModal(false)}
        onConfirm={handleDeleteSelected}
        title="Delete Selected Media"
        description="Are you sure you want to delete this media asset? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      <ConfirmationDialog
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAll}
        title="Clear All Media"
        description={`Are you sure you want to delete all ${mediaAssets.length} media assets? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      <ConfirmationDialog
        open={showDeleteIndividualModal}
        onClose={() => {
          setShowDeleteIndividualModal(false);
          setAssetToDelete(null);
        }}
        onConfirm={handleDeleteIndividual}
        title="Delete Media Asset"
        description={`Are you sure you want to delete "${assetToDelete?.filename}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />
    </Dialog>
  );
}
