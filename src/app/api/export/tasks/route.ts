import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { title, description, assigned_to, priority, due_date, assigned_by } = body;

    if (!title || !assigned_to || !assigned_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('employee_tasks')
      .insert({
        title,
        description,
        assigned_to,
        assigned_by,
        priority: priority || 'medium',
        status: 'pending',
        due_date,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration missing' },
        { status: 500 }
      );
    }

    const userId = request.nextUrl.searchParams.get('userId');
    const status = request.nextUrl.searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let query = supabase
      .from('employee_tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('due_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      total: count,
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, status, completed_at } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing task id' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('employee_tasks')
      .update({
        status,
        completed_at: status === 'completed' ? completed_at || new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}
