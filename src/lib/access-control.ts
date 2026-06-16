
import type { UserRole } from './supabase-types';

export const COMPANY_NAME = 'مفتاح النيل';

export const ACTIVE_ROLES: UserRole[] = [
  'مالك',
  'إشراف إداري',
  'موظف',
  'مستورد',
  'مورد',
  'مصدر',
];

const ROUTE_RULES: Array<{ pattern: RegExp; roles: UserRole[] }> = [
  { pattern: /^\/dashboard\/admin(\/|$)/, roles: ['مالك', 'إشراف إداري'] },
  { pattern: /^\/admin\/role-requests(\/|$)/, roles: ['مالك', 'إشراف إداري'] },
  { pattern: /^\/dashboard\/employee(\/|$)/, roles: ['مالك', 'إشراف إداري', 'موظف'] },
  { pattern: /^\/dashboard\/agent(\/|$)/, roles: ['مالك', 'إشراف إداري', 'مصدر'] },
  { pattern: /^\/customers(\/|$)/, roles: ['مالك', 'إشراف إداري', 'موظف', 'مستورد'] },
  { pattern: /^\/suppliers(\/|$)/, roles: ['مالك', 'إشراف إداري', 'موظف', 'مورد'] },
  { pattern: /^\/shipments(\/|$)/, roles: ['مالك', 'إشراف إداري', 'موظف', 'مستورد', 'مصدر'] },
  { pattern: /^\/predictive-analytics(\/|$)/, roles: ['مالك', 'إشراف إداري', 'موظف'] },
  { pattern: /^\/settings(\/|$)/, roles: ACTIVE_ROLES },
];

const OPEN_ROUTES = [
  '/login',
  '/unauthorized',
  '/favicon.ico',
  '/manifest.json',
];

export function isOpenRoute(pathname: string): boolean {
  return OPEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isPublicApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth');
}

export function isRoleAllowedForPath(role: UserRole | null | undefined, pathname: string): boolean {
  if (!role) return false;
  const match = ROUTE_RULES.find(({ pattern }) => pattern.test(pathname));
  if (!match) return true;
  return match.roles.includes(role);
}

export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') return null;
  return ACTIVE_ROLES.includes(role as UserRole) ? (role as UserRole) : null;
}

export function canManageUsers(actorRole: UserRole | null | undefined): boolean {
  return actorRole === 'مالك' || actorRole === 'إشراف إداري';
}

export function canEditCompanyContent(actorRole: UserRole | null | undefined): boolean {
  return actorRole === 'مالك' || actorRole === 'إشراف إداري' || actorRole === 'موظف';
}
