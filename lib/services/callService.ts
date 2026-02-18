import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'answered' | 'ended' | 'missed' | 'rejected';

export interface CallDoc {
    id: string;
    chatId: string;
    callerId: string;
    receiverId: string;
    type: CallType;
    status: CallStatus;
    startedAt: Date | null;
    endedAt: Date | null;
    duration: number | null; // in seconds
    createdAt: Date;
}

// Create a new call
export async function createCall(
    chatId: string,
    callerId: string,
    receiverId: string,
    type: CallType
): Promise<string> {
    const callRef = doc(collection(db, 'calls'));
    const callId = callRef.id;

    await setDoc(callRef, {
        chatId,
        callerId,
        receiverId,
        type,
        status: 'ringing',
        startedAt: null,
        endedAt: null,
        duration: null,
        createdAt: serverTimestamp(),
    });

    return callId;
}

// Update call status
export async function updateCallStatus(
    callId: string,
    status: CallStatus,
    duration?: number
): Promise<void> {
    const callRef = doc(db, 'calls', callId);
    const updates: any = {
        status,
        ...(status === 'answered' && !duration && {
            startedAt: serverTimestamp(),
        }),
        ...(status === 'ended' && {
            endedAt: serverTimestamp(),
            duration: duration || null,
        }),
    };

    await updateDoc(callRef, updates);
}

// Get a call by ID
export async function getCall(callId: string): Promise<CallDoc | null> {
    const callRef = doc(db, 'calls', callId);
    const callSnap = await getDoc(callRef);

    if (!callSnap.exists()) return null;

    const data = callSnap.data();
    return {
        id: callSnap.id,
        chatId: data.chatId,
        callerId: data.callerId,
        receiverId: data.receiverId,
        type: data.type,
        status: data.status,
        startedAt: data.startedAt?.toDate?.() || null,
        endedAt: data.endedAt?.toDate?.() || null,
        duration: data.duration || null,
        createdAt: data.createdAt?.toDate?.() || new Date(),
    } as CallDoc;
}

// Subscribe to a call
export function subscribeToCall(
    callId: string,
    callback: (call: CallDoc | null) => void
): Unsubscribe {
    const callRef = doc(db, 'calls', callId);
    return onSnapshot(callRef, (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }

        const data = snap.data();
        callback({
            id: snap.id,
            chatId: data.chatId,
            callerId: data.callerId,
            receiverId: data.receiverId,
            type: data.type,
            status: data.status,
            startedAt: data.startedAt?.toDate?.() || null,
            endedAt: data.endedAt?.toDate?.() || null,
            duration: data.duration || null,
            createdAt: data.createdAt?.toDate?.() || new Date(),
        } as CallDoc);
    });
}

// Subscribe to incoming calls for a user
export function subscribeToIncomingCalls(
    userId: string,
    callback: (calls: CallDoc[]) => void
): Unsubscribe {
    const callsRef = collection(db, 'calls');
    const q = query(
        callsRef,
        where('receiverId', '==', userId),
        where('status', '==', 'ringing')
    );

    return onSnapshot(q, (snapshot) => {
        const calls: CallDoc[] = [];
        snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            calls.push({
                id: docSnap.id,
                chatId: data.chatId,
                callerId: data.callerId,
                receiverId: data.receiverId,
                type: data.type,
                status: data.status,
                startedAt: data.startedAt?.toDate?.() || null,
                endedAt: data.endedAt?.toDate?.() || null,
                duration: data.duration || null,
                createdAt: data.createdAt?.toDate?.() || new Date(),
            } as CallDoc);
        });
        callback(calls);
    });
}
