export type UserRole = 'admin' | 'editor' | 'contributor';

export type Action = 
  | 'post:create'
  | 'post:edit'
  | 'post:publish'
  | 'post:delete'
  | 'post:review'
  | 'post:schedule'
  | 'media:view'
  | 'media:upload'
  | 'media:delete'
  | 'stats:view'
  | 'contact:view'
  | 'contact:edit'
  | 'contact:delete'
  | 'newsletter:view'
  | 'newsletter:edit'
  | 'newsletter:delete'
  | 'category:create'
  | 'category:edit'
  | 'category:delete'
  | 'category:view'
  | 'user:view'
  | 'user:edit'
  | 'user:delete';

/**
 * Mock session role - in real app this would come from auth context
 * You can change this to test different roles: 'admin', 'editor', 'contributor'
 */
export function getSessionRole(): UserRole {
  // Mock implementation - in real app, get from auth context
  // Change this value to test different roles
  return 'admin'; // Changed to admin to test user management features
}

/**
 * Check if user role can perform action
 */
export function can(userRole: UserRole, action: Action): boolean {
  const permissions: Record<UserRole, Action[]> = {
    admin: [
      'post:create',
      'post:edit', 
      'post:publish',
      'post:delete',
      'post:review',
      'post:schedule',
      'media:view',
      'media:upload',
      'media:delete',
      'media:delete',
      'stats:view',
      'contact:view',
      'contact:edit',
      'contact:delete',
      'newsletter:view',
      'newsletter:edit',
      'newsletter:delete',
      'category:create',
      'category:edit',
      'category:delete',
      'category:view',
      'user:view',
      'user:edit',
      'user:delete'
    ],
    editor: [
      'post:create',
      'post:edit',
      'post:publish',
      'post:delete',
      'post:review',
      'post:schedule',
      'media:view',
      'media:upload',
      'media:delete',
      'stats:view',
      'contact:view',
      'contact:edit',
      'newsletter:view',
      'newsletter:edit'
    ],
    contributor: [
      'post:create',
      'post:edit',
      'media:view',
      'media:upload',
      'media:delete',
      'contact:view',
      'newsletter:view'
    ]
  };

  return permissions[userRole]?.includes(action) ?? false;
}

/**
 * Get current user permissions
 */
export function getCurrentUserPermissions(): Action[] {
  const role = getSessionRole();
  const permissions: Record<UserRole, Action[]> = {
    admin: [
      'post:create',
      'post:edit', 
      'post:publish',
      'post:delete',
      'post:review',
      'post:schedule',
      'media:view',
      'media:upload',
      'media:delete',
      'media:delete',
      'stats:view',
      'contact:view',
      'contact:edit',
      'contact:delete',
      'newsletter:view',
      'newsletter:edit',
      'newsletter:delete',
      'category:create',
      'category:edit',
      'category:delete',
      'category:view',
      'user:view',
      'user:edit',
      'user:delete'
    ],
    editor: [
      'post:create',
      'post:edit',
      'post:publish',
      'post:delete',
      'post:review',
      'post:schedule',
      'media:view',
      'media:upload',
      'media:delete',
      'stats:view',
      'contact:view',
      'contact:edit',
      'newsletter:view',
      'newsletter:edit'
    ],
    contributor: [
      'post:create',
      'post:edit',
      'media:view',
      'media:upload',
      'media:delete',
      'contact:view',
      'newsletter:view'
    ]
  };

  return permissions[role] ?? [];
}
