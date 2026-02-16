import {
    collection,
    doc,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    Unsubscribe,
    increment,
    getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface MessageDoc {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    readBy: string[];
    type: 'text' | 'image' | 'file';
}

// Send a message to a chat
export async function sendMessage(
    chatId: string,
    senderId: string,
    text: string
): Promise<void> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
        senderId,
        text,
        timestamp: serverTimestamp(),
        readBy: [senderId],
        type: 'text',
    });

    // Update last message on chat document
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const participants: string[] = chatData.participants || [];

        // Build unread increments for other participants
        const unreadUpdates: Record<string, ReturnType<typeof increment>> = {};
        participants.forEach((pid) => {
            if (pid !== senderId) {
                unreadUpdates[`unreadCount.${pid}`] = increment(1);
            }
        });

        await updateDoc(chatRef, {
            lastMessage: {
                text,
                senderId,
                timestamp: new Date().toISOString(),
            },
            ...unreadUpdates,
        });
    }
}

// Subscribe to messages in a chat (real-time)
export function subscribeToMessages(
    chatId: string,
    callback: (messages: MessageDoc[]) => void
): Unsubscribe {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages: MessageDoc[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                senderId: data.senderId,
                text: data.text,
                timestamp: data.timestamp?.toDate?.() || new Date(),
                readBy: data.readBy || [],
                type: data.type || 'text',
            };
        });
        callback(messages);
    });
}

// Mark messages as read by a user
export async function markMessagesAsRead(
    chatId: string,
    userId: string
): Promise<void> {
    // Reset the unread counter for this user
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0,
    });
}
