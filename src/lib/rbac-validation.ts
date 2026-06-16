import { z } from 'zod';
import type { UserRole } from './supabase-types';

// ==========================================
// ROLE DEFINITIONS
// ==========================================

export const UserRoleSchema = z.enum([
  'مالك',
  'إشراف إداري',
  'موظف',
  'مستورد',
  'مورد',
  'مصدر',
  'مستخدم مسجل',
  'زائر'
] as const);

export const UserStatusSchema = z.enum([
  'active',
  'suspended',
  'rejected'
] as const);

export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newRole: UserRoleSchema
});

export const UpdateUserStatusSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newStatus: UserStatusSchema
});

export const RegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: UserRoleSchema.default('مستورد')
});

export function canModifyRole(actorRole: UserRole, targetRole: UserRole): boolean {
  // Owners can modify anyone except other owners (unless they are the same)
  if (actorRole === 'مالك') {
    return targetRole !== 'مالك' || actorRole === targetRole;
  }

  // إشراف إداري can modify empleados, مستورد, مورد, مصدر
  if (actorRole === 'إشراف إداري') {
    return ['موظف', 'مستورد', 'مورد', 'مصدر'].includes(targetRole);
  }

  // Others cannot modify roles
  return false;
}

export function canModifyStatus(actorRole: UserRole, targetRole: UserRole, newStatus: string): boolean {
  // Only owners and الإشراف إداري can modify status
  if (!['مالك', 'إشراف إداري'].includes(actorRole)) {
    return false;
  }

  // Cannot modify مالك status unless you are a مالك
  if (targetRole === 'مالك' && actorRole !== 'مالك') {
    return false;
  }

  return true;
}

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
    // Owners and الإشراف إداري can access any resource
    if (['مالك', 'إشراف إداري'].includes(userRole)) {
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
