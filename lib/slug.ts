/**
 * Convert string to URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug by appending number if needed
 */
export async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = slugify(baseSlug);
  let counter = 1;
  
  // Check if slug exists (mock implementation)
  while (await slugExists(slug)) {
    slug = `${slugify(baseSlug)}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Mock function to check if slug exists
 * In real app, this would query the database
 */
async function slugExists(slug: string): Promise<boolean> {
  // Mock implementation - in real app, query database
  const existingSlugs = ['hello-world', 'test-post', 'my-article'];
  return existingSlugs.includes(slug);
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}
