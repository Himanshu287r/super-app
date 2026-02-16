import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore';

// Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyDxnja-SHzAfcYtcHhH0E0dE3AbW7xIGNU",
    authDomain: "chatapp-d142c.firebaseapp.com",
    projectId: "chatapp-d142c",
    storageBucket: "chatapp-d142c.firebasestorage.app",
    messagingSenderId: "371956229618",
    appId: "1:371956229618:web:c12af1f1b36251eb78b76b",
    measurementId: "G-J2S039WGHL",
};

// Initialize Firebase (prevent duplicate initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with offline persistence
let db: ReturnType<typeof getFirestore>;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
        }),
    });
} catch {
    // If already initialized, just get the instance
    db = getFirestore(app);
}

export { db };
export default app;
