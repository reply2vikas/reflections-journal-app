import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use named database id if provided, else fallback to standard instance
let firestoreDb: Firestore;
try {
  if (firebaseConfigRaw.firestoreDatabaseId && firebaseConfigRaw.firestoreDatabaseId !== '(default)') {
    firestoreDb = getFirestore(app, firebaseConfigRaw.firestoreDatabaseId);
  } else {
    firestoreDb = getFirestore(app);
  }
} catch (err) {
  console.warn('Error initializing specific Firestore databaseId, falling back to default:', err);
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Strips all undefined properties recursively before passing any object to Firestore SDKs.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}
