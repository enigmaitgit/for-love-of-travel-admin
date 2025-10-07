export function resolveImageUrl(input?: string): string {
  if (!input) return '';
  // Already a full or data URL
  if (input.startsWith('http') || input.startsWith('data:')) {
    return input;
  }
  
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  
  // If it begins with `/uploads/`, extract filename and use serve endpoint
  if (input.startsWith('/uploads/')) {
    const filename = input.replace('/uploads/', '');
    return `${base}/api/v1/media/serve/${filename}`;
  }
  
  // Bare filename or media ID -> use serve endpoint
  return `${base}/api/v1/media/serve/${input}`;
}
