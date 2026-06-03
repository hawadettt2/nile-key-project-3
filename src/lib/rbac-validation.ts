import { z } from 'zod';
import type { UserRole, UserStatus } from './supabase-types';

// Re-export types
export type { UserRole, UserStatus };

// Zod schema for role validation
export const UserRoleSchema = z.enum([
  'owner',
  'admin', 
  'employee',
  'importer',
  'supplier',
  'agent'
] as const);

// Zod schema for status validation
export const UserStatusSchema = z.enum([
  'active',
  'suspended',
  'rejected'
] as const);

// Zod schema for updating user role (requires admin/owner)
export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newRole: UserRoleSchema
});

// Zod schema for updating user status (requires admin/owner)
export const UpdateUserStatusSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newStatus: UserStatusSchema
});

// Zod schema for registration
export const RegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: UserRoleSchema.default('importer')
});

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'owner': 100,
  'admin': 80,
  'employee': 60,
  'importer': 40,
  'supplier': 40,
  'agent': 40
};

// Check if a role can perform action on another role
export function canModifyRole(actorRole: UserRole, targetRole: UserRole): boolean {
  // Owners can modify anyone except other owners (unless they are the same)
  if (actorRole === 'owner') {
    return targetRole !== 'owner' || actorRole === targetRole;
  }
  
  // Admins can modify employees, importers, suppliers, agents
  if (actorRole === 'admin') {
    return ['employee', 'importer', 'supplier', 'agent'].includes(targetRole);
  }
  
  // Others cannot modify roles
  return false;
}

// Check if a role can modify user status
export function canModifyStatus(actorRole: UserRole, targetRole: UserRole, newStatus: string): boolean {
  // Only owners and admins can modify status
  if (!['owner', 'admin'].includes(actorRole)) {
    return false;
  }
  
  // Cannot modify owner status unless you are an owner
  if (targetRole === 'owner' && actorRole !== 'owner') {
    return false;
  }
  
  return true;
}

// Validate role-based access for server actions
export function validateRoleAccess(
  actorRole: UserRole,
  requiredRoles: UserRole[],
  action: string
): { success: boolean; error?: string } {
  if (!requiredRoles.includes(actorRole)) {
    return {
      success: false,
      error: `Access denied. Role '${actorRole}' cannot perform action: ${action}. Required roles: ${requiredRoles.join(', ')}`
    };
  }
  
  return { success: true };
}

// Middleware helper to check role permissions
export async function checkUserPermission(
  userRole: UserRole | null,
  requiredRoles: UserRole[],
  resourceOwnerId?: string,
  currentUserId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check if user has required role
  if (!userRole || !requiredRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
    };
  }
  
  // For resource-specific access (prevent IDOR)
  if (resourceOwnerId && currentUserId) {
    // Owners and admins can access any resource
    if (['owner', 'admin'].includes(userRole)) {
      return { allowed: true };
    }
    
    // Others can only access their own resources
    if (resourceOwnerId !== currentUserId) {
      return {
        allowed: false,
        reason: 'Access denied. You can only access your own resources.'
      };
    }
  }
  
  return { allowed: true };
}

// Export type inference
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;
export type RegistrationInput = z.infer<typeof RegistrationSchema>;
