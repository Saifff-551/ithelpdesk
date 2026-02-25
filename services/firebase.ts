import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import {
    getFirestore,
    collection,
    query,
    where,
    CollectionReference,
    DocumentData,
} from 'firebase/firestore';

// Firebase configuration — loaded from environment variables
// SECURITY: No API keys in source code. All values via .env files.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Runtime validation — fail fast if keys are missing
const requiredKeys = ['apiKey', 'authDomain', 'projectId'] as const;
for (const key of requiredKeys) {
    if (!firebaseConfig[key]) {
        console.error(`[MATIE Security] Missing required Firebase env var: VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
}

//Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Helper function to create a typed collection reference
export const createCollection = <T = DocumentData>(collectionName: string) => {
    return collection(db, collectionName) as CollectionReference<T>;
};

// Helper function to create tenant-scoped query
export const createTenantQuery = <T = DocumentData>(
    collectionName: string,
    tenantId: string
) => {
    const col = createCollection<T>(collectionName);
    return query(col, where('tenant_id', '==', tenantId));
};

export default app;
