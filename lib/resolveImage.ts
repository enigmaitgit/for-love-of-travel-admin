export function resolveImageUrl(input?: string): string {
  if (!input) return '';
  // Already a full or data URL
  if (input.startsWith('http') || input.startsWith('data:')) {
    return input;
  }
  
  // Use frontend API route instead of calling backend directly
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  
  // If it's an API endpoint (like video placeholder), use frontend proxy
  if (input.startsWith('/api/')) {
    // Convert backend API path to frontend API path
    if (input.startsWith('/api/v1/media/video-placeholder')) {
      return `${base}/api/admin/media/video-placeholder`;
    }
    return `${base}${input}`;
  }
  
  // If it begins with `/uploads/`, extract filename and use serve endpoint
  if (input.startsWith('/uploads/')) {
    const filename = input.replace('/uploads/', '');
    return `${base}/api/admin/media/serve/${filename}`;
  }
  
  // Bare filename or media ID -> use serve endpoint
  return `${base}/api/admin/media/serve/${input}`;
}
