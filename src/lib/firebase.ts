import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBBVF7fGTv1Wo5O9bwMixlLuoeu5QIZG0Q",
  authDomain: "clientvault-4dd2f.firebaseapp.com",
  projectId: "clientvault-4dd2f",
  storageBucket: "clientvault-4dd2f.firebasestorage.app",
  messagingSenderId: "143966081174",
  appId: "1:143966081174:web:f1cba530e2aa2091a2f2b7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-227fbfa7-08ca-4510-a99a-aebc0c2dbe89");

// Initialize Auth with a safe persistence chain for sandboxed environments
let auth: any;
try {
  auth = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
  });
} catch (error) {
  auth = getAuth(app);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { app, db, auth };
