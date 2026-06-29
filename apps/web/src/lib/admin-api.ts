import { apiFetch } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  createdAt: string;
}

export function adminListUsers() {
  return apiFetch<AdminUser[]>('/admin/users');
}

export function adminUpdateUser(
  id: string,
  input: { displayName?: string; role?: 'user' | 'admin' }
) {
  return apiFetch<AdminUser>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function adminDeleteUser(id: string) {
  return apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' });
}
