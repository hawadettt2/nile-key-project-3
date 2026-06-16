import { canModifyRole, UserRoleSchema } from '@/lib/rbac-validation';
import type { UserRole } from '@/lib/supabase-types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runRoleServiceUnitTests() {
  const roles: UserRole[] = ['مالك', 'إشراف إداري', 'موظف', 'مستورد', 'مورد', 'مصدر', 'مستخدم مسجل', 'زائر'];

  for (const role of roles) {
    assert(UserRoleSchema.safeParse(role).success, `الدور غير صالح: ${role}`);
  }

  assert(!UserRoleSchema.safeParse('owner').success, 'الدور الإنجليزي owner يجب أن يرفض.');
  assert(canModifyRole('مالك', 'موظف'), 'المالك يستطيع تعديل الموظف.');
  assert(!canModifyRole('موظف', 'مالك'), 'الموظف لا يستطيع تعديل المالك.');
  assert(canModifyRole('إشراف إداري', 'مستورد'), 'المشرف الإداري يستطيع تعديل المستورد.');
  assert(!canModifyRole('مستورد', 'موظف'), 'المستورد لا يستطيع تعديل الموظف.');

  return true;
}

if (require.main === module) {
  try {
    runRoleServiceUnitTests();
    console.log('تم اجتياز اختبارات RBAC بنجاح.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
