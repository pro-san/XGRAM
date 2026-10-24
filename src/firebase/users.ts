import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import type { AppUser } from '../types';

export async function searchUsersByUsername(prefix: string): Promise<AppUser[]> {
  const normalized = prefix.trim().toLowerCase();
  const q = query(
    collection(db, 'users'),
    where('status', 'in', ['online', 'offline']),
    limit(30),
  );
  try {
    const snap = await getDocs(q);
    const allUsers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser);
    if (!normalized) {
      return allUsers.slice(0, 10);
    }
    return allUsers
      .filter(
        (u) =>
          u.username.toLowerCase().includes(normalized) ||
          u.displayName.toLowerCase().includes(normalized),
      )
      .slice(0, 10);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}
