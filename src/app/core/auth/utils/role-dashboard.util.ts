/**
 * Post-login / post-auth redirect targets by tenant role (Construvasco).
 */
export function resolveRoleDashboardPath(roleLike: unknown): string {
  const role = String(roleLike ?? '').toLowerCase().trim();

  if (!role || role === 'customer') {
    return '/conta/dashboard';
  }

  return '/admin/dashboard';
}

export function isStaffRole(roleLike: unknown): boolean {
  const role = String(roleLike ?? '').toLowerCase().trim();
  return role !== '' && role !== 'customer';
}
