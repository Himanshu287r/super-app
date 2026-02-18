import {
    collection,
    doc,
    setDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SignalingData {
    type: 'offer' | 'answer' | 'ice-candidate';
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    from: string;
    to: string;
    timestamp: Date;
}

/**
 * Subscribe to signaling messages for a call
 * This listens for WebRTC offers, answers, and ICE candidates
 */
export function subscribeToSignaling(
    callId: string,
    userId: string,
    callbacks: {
        onOffer?: (offer: RTCSessionDescriptionInit) => void;
        onAnswer?: (answer: RTCSessionDescriptionInit) => void;
        onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
    }
): Unsubscribe {
    const signalingRef = collection(db, 'calls', callId, 'signaling');
    const q = query(
        signalingRef,
        where('to', '==', userId),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                
                if (data.type === 'offer' && data.sdp && callbacks.onOffer) {
                    callbacks.onOffer(data.sdp);
                } else if (data.type === 'answer' && data.sdp && callbacks.onAnswer) {
                    callbacks.onAnswer(data.sdp);
                } else if (data.type === 'ice-candidate' && data.candidate && callbacks.onIceCandidate) {
                    callbacks.onIceCandidate(data.candidate);
                }
            }
        });
    });
}

/**
 * Send a signaling message (offer, answer, or ICE candidate)
 */
export async function sendSignaling(
    callId: string,
    type: 'offer' | 'answer' | 'ice-candidate',
    from: string,
    to: string,
    sdp?: RTCSessionDescriptionInit,
    candidate?: RTCIceCandidateInit
): Promise<void> {
    const signalingRef = doc(collection(db, 'calls', callId, 'signaling'));
    
    await setDoc(signalingRef, {
        type,
        from,
        to,
        sdp: sdp ? JSON.parse(JSON.stringify(sdp)) : null,
        candidate: candidate ? JSON.parse(JSON.stringify(candidate)) : null,
        timestamp: serverTimestamp(),
    });
}
