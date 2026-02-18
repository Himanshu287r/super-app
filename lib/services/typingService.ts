import { doc, updateDoc, onSnapshot, Unsubscribe, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface TypingStatus {
    userId: string;
    timestamp: Date;
}

// Set typing status for a user in a chat
export async function setTypingStatus(
    chatId: string,
    userId: string,
    isTyping: boolean
): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    
    if (isTyping) {
        await updateDoc(chatRef, {
            [`typing.${userId}`]: serverTimestamp(),
        });
    } else {
        await updateDoc(chatRef, {
            [`typing.${userId}`]: null,
        });
    }
}

// Subscribe to typing status changes in a chat
export function subscribeToTypingStatus(
    chatId: string,
    currentUserId: string,
    callback: (typingUsers: string[]) => void
): Unsubscribe {
    const chatRef = doc(db, 'chats', chatId);
    
    return onSnapshot(chatRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }
        
        const data = snapshot.data();
        const typing = data.typing || {};
        const typingUsers: string[] = [];
        const now = Date.now();
        
        // Check each typing status and filter out stale ones (older than 3 seconds)
        for (const userId of Object.keys(typing)) {
            if (userId === currentUserId) continue; // Don't show own typing status
            
            const typingTimestamp = typing[userId];
            if (typingTimestamp) {
                let timestamp: number;
                if (typingTimestamp instanceof Timestamp) {
                    timestamp = typingTimestamp.toDate().getTime();
                } else if (typingTimestamp.toDate) {
                    timestamp = typingTimestamp.toDate().getTime();
                } else if (typeof typingTimestamp === 'number') {
                    timestamp = typingTimestamp;
                } else {
                    continue; // Skip invalid timestamp
                }
                
                const timeDiff = now - timestamp;
                
                // Only show if typing status is less than 3 seconds old
                if (timeDiff >= 0 && timeDiff < 3000) {
                    typingUsers.push(userId);
                }
            }
        }
        
        callback(typingUsers);
    });
}
