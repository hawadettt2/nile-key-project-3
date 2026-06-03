
import type { UserRole } from './supabase-types';

export const COMPANY_NAME = 'مفتاح النيل';

export const ACTIVE_ROLES: UserRole[] = [
  'owner',
  'admin',
  'employee',
  'importer',
  'supplier',
  'agent',
];

const ROUTE_RULES: Array<{ pattern: RegExp; roles: UserRole[] }> = [
  { pattern: /^\/dashboard\/admin(\/|$)/, roles: ['owner', 'admin'] },
  { pattern: /^\/dashboard\/employee(\/|$)/, roles: ['owner', 'admin', 'employee'] },
  { pattern: /^\/dashboard\/agent(\/|$)/, roles: ['owner', 'admin', 'agent'] },
  { pattern: /^\/customers(\/|$)/, roles: ['owner', 'admin', 'employee', 'importer'] },
  { pattern: /^\/suppliers(\/|$)/, roles: ['owner', 'admin', 'employee', 'supplier'] },
  { pattern: /^\/shipments(\/|$)/, roles: ['owner', 'admin', 'employee', 'importer', 'agent'] },
  { pattern: /^\/important-sites(\/|$)/, roles: ['owner', 'admin', 'employee', 'importer', 'supplier', 'agent'] },
  { pattern: /^\/predictive-analytics(\/|$)/, roles: ['owner', 'admin', 'employee'] },
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
  return pathname.startsWith('/api/auth') || pathname.startsWith('/api/trade-intelligence');
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
  return actorRole === 'owner' || actorRole === 'admin';
}

export function canEditCompanyContent(actorRole: UserRole | null | undefined): boolean {
  return actorRole === 'owner' || actorRole === 'admin' || actorRole === 'employee';
}
