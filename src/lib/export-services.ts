import { supabase } from '@/supabase/client';
import type { ExportOpportunity, ExportAlert, EmployeeTask } from './supabase-types';

/**
 * Export Alerts Service
 * Manages alert creation, retrieval, and updates
 */

export async function createAlert(alert: {
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  alert_type: 'opportunity' | 'market_change' | 'regulatory' | 'shipment' | 'supplier' | 'custom';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  related_opportunity_id?: string;
  related_shipment_id?: string;
  related_supplier_id?: string;
  metadata?: Record<string, any>;
}) {
  const response = await fetch('/api/export/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...alert,
      userId: (await supabase.auth.getUser()).data.user?.id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create alert: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserAlerts(filters?: {
  alertType?: string;
  isRead?: boolean;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const params = new URLSearchParams({
    userId: user.id,
    ...(filters?.alertType && { type: filters.alertType }),
    ...(filters?.isRead !== undefined && { isRead: String(filters.isRead) }),
  });

  const response = await fetch(`/api/export/alerts?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }

  return response.json();
}

export async function markAlertAsRead(alertId: string) {
  const response = await fetch('/api/export/alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId, is_read: true }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark alert as read: ${response.statusText}`);
  }
}

export async function dismissAlert(alertId: string) {
  const response = await fetch('/api/export/alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertId, is_dismissed: true }),
  });

  if (!response.ok) {
    throw new Error(`Failed to dismiss alert: ${response.statusText}`);
  }
}

/**
 * Employee Tasks Service
 */

export async function createTask(task: {
  title: string;
  description?: string;
  assigned_to: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const response = await fetch('/api/export/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...task,
      assigned_by: user.id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserTasks(filters?: { status?: string }) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const params = new URLSearchParams({
    userId: user.id,
    ...(filters?.status && { status: filters.status }),
  });

  const response = await fetch(`/api/export/tasks?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }

  return response.json();
}

export async function updateTaskStatus(taskId: string, status: string) {
  const response = await fetch('/api/export/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: taskId,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Export Opportunities Service
 */

export async function createOpportunity(opportunity: {
  product_name_ar: string;
  product_name_en: string;
  target_country: string;
  market_size_usd?: number;
  demand_trend?: 'increasing' | 'stable' | 'decreasing';
  competition_level?: 'low' | 'medium' | 'high' | 'very_high';
  confidence_score?: number;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const response = await fetch('/api/export/opportunities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...opportunity,
      discovered_by: user.id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create opportunity: ${response.statusText}`);
  }

  return response.json();
}

export async function getOpportunities(filters?: {
  country?: string;
  status?: string;
  minConfidence?: number;
}) {
  const params = new URLSearchParams({
    ...(filters?.country && { country: filters.country }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.minConfidence && { minConfidence: String(filters.minConfidence) }),
  });

  const response = await fetch(`/api/export/opportunities?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
  }

  return response.json();
}

export async function updateOpportunity(opportunityId: string, updates: { status?: string; confidence_score?: number }) {
  const response = await fetch('/api/export/opportunities', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: opportunityId,
      ...updates,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update opportunity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Supplier Ratings Service
 */

export async function createSupplierRating(rating: {
  supplier_id: string;
  quality_score: number;
  delivery_score: number;
  communication_score: number;
  reliability_score: number;
  comments?: string;
}) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const response = await fetch('/api/export/supplier-ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...rating,
      rated_by: user.id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create rating: ${response.statusText}`);
  }

  return response.json();
}

export async function getSupplierRatings(filters?: {
  supplierId?: string;
  minRating?: number;
}) {
  const params = new URLSearchParams({
    ...(filters?.supplierId && { supplierId: filters.supplierId }),
    ...(filters?.minRating && { minRating: String(filters.minRating) }),
  });

  const response = await fetch(`/api/export/supplier-ratings?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ratings: ${response.statusText}`);
  }

  return response.json();
}

/**
 * HS Codes Service
 */

export async function getHsCodes(filters?: {
  code?: string;
  category?: string;
  search?: string;
}) {
  const params = new URLSearchParams({
    ...(filters?.code && { code: filters.code }),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.search && { search: filters.search }),
  });

  const response = await fetch(`/api/export/hs-codes?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch HS codes: ${response.statusText}`);
  }

  return response.json();
}

export async function createHsCode(code: {
  code: string;
  product_name_ar?: string;
  product_name_en?: string;
  product_description: string;
  category?: string;
  is_agricultural?: boolean;
  tariff_rate?: number;
}) {
  const response = await fetch('/api/export/hs-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(code),
  });

  if (!response.ok) {
    throw new Error(`Failed to create HS code: ${response.statusText}`);
  }

  return response.json();
}
