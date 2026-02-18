import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    serverTimestamp,
    updateDoc,
    onSnapshot,
    Unsubscribe,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string;
    photoURL: string | null;
    phoneNumber: string | null;
    isOnline: boolean;
    lastSeen: Date | null;
    about: string;
    createdAt: Date;
    location?: {
        latitude: number;
        longitude: number;
        updatedAt: Date;
    };
}

// Create or update user document in Firestore when they sign in
export async function createOrUpdateUser(firebaseUser: FirebaseUser): Promise<void> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // New user — create profile
        await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailLookup: firebaseUser.email?.toLowerCase() || null,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber,
            isOnline: true,
            lastSeen: serverTimestamp(),
            about: 'Hey there! I am using Chat App.',
            createdAt: serverTimestamp(),
        });
    } else {
        // Existing user — update online status
        await updateDoc(userRef, {
            isOnline: true,
            lastSeen: serverTimestamp(),
            // Ensure emailLookup exists for older accounts
            emailLookup: firebaseUser.email?.toLowerCase() || null,
            // Update display name / photo if changed from auth provider
            ...(firebaseUser.displayName && { displayName: firebaseUser.displayName }),
            ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
        });
    }
}

// Get a single user by ID
export async function getUser(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    const location = data.location;
    return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
        isOnline: data.isOnline,
        lastSeen: data.lastSeen?.toDate?.() || null,
        about: data.about || '',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: location.updatedAt?.toDate?.() || new Date(),
        } : undefined,
    } as UserProfile;
}

// Search users by email (case-insensitive)
export async function searchUserByEmail(email: string): Promise<UserProfile | null> {
    const usersRef = collection(db, 'users');
    const normalizedEmail = email.toLowerCase().trim();

    // Try emailLookup field first (lowercase), then fallback to email field
    let q = query(usersRef, where('emailLookup', '==', normalizedEmail));
    let snapshot = await getDocs(q);

    // Fallback: search by original email field (for users who signed up before the fix)
    if (snapshot.empty) {
        q = query(usersRef, where('email', '==', normalizedEmail));
        snapshot = await getDocs(q);
    }

    // Final fallback: try exact match as typed (original casing)
    if (snapshot.empty) {
        q = query(usersRef, where('email', '==', email.trim()));
        snapshot = await getDocs(q);
    }

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    const location = data.location;
    return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
        isOnline: data.isOnline,
        lastSeen: data.lastSeen?.toDate?.() || null,
        about: data.about || '',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: location.updatedAt?.toDate?.() || new Date(),
        } : undefined,
    } as UserProfile;
}

// Update user's online status
export async function setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
    });
}

// Update user profile
export async function updateUserProfile(
    userId: string,
    updates: { displayName?: string; about?: string; photoURL?: string }
): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
}

// Update user location
export async function updateUserLocation(
    userId: string,
    latitude: number,
    longitude: number
): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        location: {
            latitude,
            longitude,
            updatedAt: serverTimestamp(),
        },
    });
}

// Subscribe to all online users with locations
export function subscribeToOnlineUsers(
    callback: (users: UserProfile[]) => void
): Unsubscribe {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isOnline', '==', true));
    
    return onSnapshot(q, (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const location = data.location;
            users.push({
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                photoURL: data.photoURL,
                phoneNumber: data.phoneNumber,
                isOnline: data.isOnline,
                lastSeen: data.lastSeen?.toDate?.() || null,
                about: data.about || '',
                createdAt: data.createdAt?.toDate?.() || new Date(),
                location: location ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    updatedAt: location.updatedAt?.toDate?.() || new Date(),
                } : undefined,
            });
        });
        callback(users);
    });
}

// Subscribe to multiple users' presence (for chat list)
export function subscribeToUsers(
    userIds: string[],
    callback: (users: Map<string, UserProfile>) => void
): Unsubscribe {
    if (userIds.length === 0) {
        callback(new Map());
        return () => { };
    }

    // Firestore 'in' queries are limited to 30 elements
    const batches = [];
    for (let i = 0; i < userIds.length; i += 30) {
        batches.push(userIds.slice(i, i + 30));
    }

    const usersMap = new Map<string, UserProfile>();
    const unsubscribes: Unsubscribe[] = [];

    for (const batch of batches) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', 'in', batch));
        const unsub = onSnapshot(q, (snapshot) => {
            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                const location = data.location;
                usersMap.set(data.uid, {
                    uid: data.uid,
                    email: data.email,
                    displayName: data.displayName,
                    photoURL: data.photoURL,
                    phoneNumber: data.phoneNumber,
                    isOnline: data.isOnline,
                    lastSeen: data.lastSeen?.toDate?.() || null,
                    about: data.about || '',
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    location: location ? {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        updatedAt: location.updatedAt?.toDate?.() || new Date(),
                    } : undefined,
                });
            });
            callback(new Map(usersMap));
        });
        unsubscribes.push(unsub);
    }

    return () => unsubscribes.forEach((u) => u());
}
