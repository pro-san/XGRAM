import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import type { AppUser } from '../types';

const googleProvider = new GoogleAuthProvider();

function sanitizeUsername(raw: string, fallbackUid: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (cleaned.length >= 1) {
    return cleaned.slice(0, 60);
  }
  return fallbackUid.slice(0, 8).toLowerCase();
}

export async function ensureUserDoc(user: User, extra?: Partial<AppUser>) {
  const publicPath = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, publicPath);
  }

  const displayName = (
    extra?.displayName ||
    user.displayName ||
    user.email?.split('@')[0] ||
    'New User'
  ).slice(0, 100);
  const username = sanitizeUsername(
    extra?.username || user.email?.split('@')[0] || user.displayName || '',
    user.uid,
  );
  const photoURL = (extra?.photoURL ?? user.photoURL ?? '').slice(0, 1000);

  const email = (user.email || '').trim().toLowerCase().slice(0, 254);

  if (!exists) {
    try {
      await setDoc(ref, {
        uid: user.uid,
        displayName,
        username,
        email,
        photoURL,
        status: 'online',
        language: extra?.language === 'km' ? 'km' : 'en',
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, publicPath);
    }

    const privatePath = `users/${user.uid}/private/info`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
        uid: user.uid,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }
  } else {
    try {
      await updateDoc(ref, {
        email,
        status: 'online',
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, publicPath);
    }
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  username: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  if (cred.user.emailVerified) {
    await ensureUserDoc(cred.user, { displayName, username });
  }
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (cred.user.emailVerified) {
    await ensureUserDoc(cred.user);
  }
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
}
