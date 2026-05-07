import type { PayloadRequest } from 'payload';

/**
 * Returns true when the user is a studio admin — either:
 *   - a Stewards `User` with `role === 'admin'`, or
 *   - a `Member` with `'admin'` in `roles[]`.
 */
export function isStudioAdmin(user: PayloadRequest['user']): boolean {
  if (!user) return false;
  if (user.collection === 'users') return user.role === 'admin';
  if (user.collection === 'members') return user.roles.includes('admin');
  return false;
}

/**
 * Returns true when the user is a Member with the 'instructor' role
 * (and is not necessarily an admin).
 */
export function isInstructor(user: PayloadRequest['user']): boolean {
  if (!user) return false;
  if (user.collection !== 'members') return false;
  return user.roles.includes('instructor');
}
