import { create } from 'zustand';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ensureUserDoc } from '../firebase/auth';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import type { AppUser } from '../types';

interface AuthState {
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  loading: true,
  init: () => {
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      set({ firebaseUser: user, loading: false });
      if (user) {
        if (user.emailVerified) {
          try {
            await ensureUserDoc(user);
          } catch (err) {
            console.error(err);
          }
        }
        const userPath = `users/${user.uid}`;
        unsubProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (snap.exists()) {
              set({
                profile: {
                  uid: snap.id,
                  email: user.email || '',
                  ...snap.data(),
                } as AppUser,
              });
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, userPath);
          },
        );
      } else {
        set({ profile: null });
      }
    });
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  },
}));
