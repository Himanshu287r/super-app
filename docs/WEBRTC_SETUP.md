# WebRTC Call Implementation Guide

This guide explains how to complete the WebRTC signaling implementation for voice and video calls.

## Overview

The call infrastructure is already set up with:
- ✅ Call state management (`callService.ts`)
- ✅ WebRTC service (`webrtcService.ts`)
- ✅ Call UI component (`CallModal.tsx`)
- ✅ Integration in ChatWindow

**What's missing:** The signaling layer to exchange WebRTC offers, answers, and ICE candidates between peers.

## Architecture

```
Caller                    Firestore                    Receiver
  |                          |                            |
  |-- Create Call ---------->|                            |
  |                          |-- Notify Receiver --------->|
  |                          |                            |
  |-- Create Offer --------->|                            |
  |                          |-- Send Offer -------------->|
  |                          |                            |
  |                          |<-- Create Answer ----------|
  |<-- Send Answer ----------|                            |
  |                          |                            |
  |-- ICE Candidate -------->|                            |
  |                          |-- Forward ICE ------------>|
  |                          |                            |
  |<-- ICE Candidate --------|                            |
  |                          |                            |
  |<-- Connected ------------|----------------------------|
```

## Step 1: Create Signaling Service

Create `lib/services/signalingService.ts`:

```typescript
import {
    collection,
    doc,
    setDoc,
    onSnapshot,
    updateDoc,
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

// Subscribe to signaling messages for a call
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
    const q = query(signalingRef, where('to', '==', userId), orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data() as SignalingData;
                
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

// Send signaling message
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
```

## Step 2: Update CallModal with Signaling

Update `components/ChatWindow/CallModal.tsx` to add signaling:

```typescript
import { subscribeToSignaling, sendSignaling } from '@/lib/services/signalingService';

// Inside CallModal component, add after WebRTC initialization:

useEffect(() => {
    if (!call || call.status !== 'answered' || !webrtcRef.current) return;

    const webrtc = webrtcRef.current;
    let signalingUnsubscribe: Unsubscribe | null = null;

    const setupSignaling = async () => {
        // Set up signaling listener
        signalingUnsubscribe = subscribeToSignaling(
            call.id,
            currentUserId,
            {
                onOffer: async (offer) => {
                    // Receiver receives offer
                    const answer = await webrtc.createAnswer(offer);
                    await sendSignaling(call.id, 'answer', currentUserId, call.callerId, answer);
                },
                onAnswer: async (answer) => {
                    // Caller receives answer
                    await webrtc.setRemoteDescription(answer);
                },
                onIceCandidate: async (candidate) => {
                    await webrtc.addIceCandidate(candidate);
                },
            }
        );

        // If caller, create and send offer
        if (isCaller) {
            const offer = await webrtc.createOffer();
            await sendSignaling(call.id, 'offer', currentUserId, call.receiverId, offer);
        }

        // Set up ICE candidate handler
        webrtc.peerConnection?.addEventListener('icecandidate', async (event) => {
            if (event.candidate) {
                const targetUserId = isCaller ? call.receiverId : call.callerId;
                await sendSignaling(
                    call.id,
                    'ice-candidate',
                    currentUserId,
                    targetUserId,
                    undefined,
                    event.candidate.toJSON()
                );
            }
        });
    };

    setupSignaling();

    return () => {
        if (signalingUnsubscribe) {
            signalingUnsubscribe();
        }
    };
}, [call?.status, call?.id, currentUserId, isCaller]);
```

## Step 3: Add Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... existing rules ...
    
    // Calls collection
    match /calls/{callId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.callerId || 
         request.auth.uid == resource.data.receiverId);
      
      // Signaling subcollection
      match /signaling/{signalingId} {
        allow read, write: if request.auth != null && 
          (request.auth.uid == resource.data.from || 
           request.auth.uid == resource.data.to);
      }
    }
  }
}
```

## Step 4: Add TURN Servers (Optional but Recommended)

For better connectivity, especially through firewalls/NATs, add TURN servers:

1. **Free Options:**
   - Use a free TURN service like [Metered TURN](https://www.metered.ca/tools/openrelay/)
   - Or set up your own using [coturn](https://github.com/coturn/coturn)

2. **Update `webrtcService.ts`:**
```typescript
const defaultRTCConfig: RTCConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:your-turn-server.com:3478',
            username: 'your-username',
            credential: 'your-password'
        }
    ],
};
```

## Step 5: Testing

1. Open the app in two browser windows/tabs
2. Log in as different users
3. Start a chat between them
4. Click the phone/video button
5. Accept the call in the other window
6. Check browser console for any errors

## Troubleshooting

### No audio/video
- Check browser permissions for microphone/camera
- Verify media tracks are added to peer connection
- Check if streams are attached to video elements

### Connection fails
- Check TURN server configuration
- Verify Firestore security rules
- Check network connectivity
- Look for ICE connection state errors in console

### Signaling not working
- Verify Firestore rules allow signaling writes
- Check that `subscribeToSignaling` is called correctly
- Ensure signaling messages are being created in Firestore

## Alternative: Use a Signaling Service

Instead of Firestore, you can use:
- **Socket.io** - Real-time signaling server
- **WebSocket** - Custom WebSocket server
- **Twilio** - Complete calling solution (paid)
- **Agora** - Video/voice SDK (paid)

## Next Steps

1. Implement the signaling service
2. Add error handling and reconnection logic
3. Add call history/recording features
4. Implement group calls (more complex)
5. Add screen sharing capability

## Resources

- [WebRTC MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
