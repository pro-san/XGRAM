import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import type { AppUser } from '../types';

export async function searchUsers(rawQuery: string): Promise<AppUser[]> {
  const normalized = rawQuery.trim().toLowerCase().replace(/^@+/, '');
  const emailLocalPart = normalized.includes('@') ? normalized.split('@')[0] : '';

  const q = query(
    collection(db, 'users'),
    where('status', 'in', ['online', 'offline']),
    limit(50),
  );
  try {
    const snap = await getDocs(q);
    const allUsers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser);
    if (!normalized) {
      return allUsers.slice(0, 15);
    }
    return allUsers
      .filter((u) => {
        const username = (u.username || '').toLowerCase();
        const displayName = (u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const matchesDirect =
          username.includes(normalized) ||
          email.includes(normalized) ||
          displayName.includes(normalized);
        const matchesEmailPrefix =
          Boolean(emailLocalPart) &&
          (username === emailLocalPart || username.includes(emailLocalPart));
        return matchesDirect || matchesEmailPrefix;
      })
      .slice(0, 15);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export const searchUsersByUsername = searchUsers;
