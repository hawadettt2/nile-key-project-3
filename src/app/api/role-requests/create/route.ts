import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-auth';
import { createRoleRequest } from '@/lib/role-request-service';

function errorResponse(error: ApiError) {
  return NextResponse.json({ success: false, error: error.message }, { status: error.status });
}

export async function POST(request: NextRequest) {
  try {
    const data = await createRoleRequest(request);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error instanceof ApiError ? error : new ApiError(500, 'حدث خطأ غير متوقع.'));
  }
}
