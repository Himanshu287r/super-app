import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    Unsubscribe,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ChatDoc {
    id: string;
    participants: string[]; // Array of user UIDs
    isGroup: boolean;
    groupName: string | null;
    groupInfo: string | null; // Optional group description/info
    createdAt: Date;
    lastMessage: {
        text: string;
        senderId: string;
        timestamp: Date;
    } | null;
    unreadCount: Record<string, number>; // { [userId]: count }
}

// Create a 1:1 chat between two users
export async function createDirectChat(
    userId1: string,
    userId2: string
): Promise<string> {
    // Check if chat already exists
    const existingChatId = await findDirectChat(userId1, userId2);
    if (existingChatId) return existingChatId;

    const chatRef = doc(collection(db, 'chats'));
    const chatData = {
        participants: [userId1, userId2],
        isGroup: false,
        groupName: null,
        createdAt: serverTimestamp(),
        lastMessage: null,
        unreadCount: { [userId1]: 0, [userId2]: 0 },
    };

    await setDoc(chatRef, chatData);
    return chatRef.id;
}

// Find existing direct chat between two users
export async function findDirectChat(
    userId1: string,
    userId2: string
): Promise<string | null> {
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef,
        where('participants', 'array-contains', userId1),
        where('isGroup', '==', false)
    );

    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.participants.includes(userId2)) {
            return docSnap.id;
        }
    }

    return null;
}

// Create a group chat
export async function createGroupChat(
    name: string,
    participantIds: string[],
    creatorId: string,
    groupInfo?: string | null
): Promise<string> {
    const chatRef = doc(collection(db, 'chats'));

    // Make sure creator is included
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    const unreadCount: Record<string, number> = {};
    allParticipants.forEach((id) => (unreadCount[id] = 0));

    const chatData = {
        participants: allParticipants,
        isGroup: true,
        groupName: name,
        groupInfo: groupInfo || null,
        createdAt: serverTimestamp(),
        lastMessage: null,
        unreadCount,
    };

    await setDoc(chatRef, chatData);
    return chatRef.id;
}

// Subscribe to all chats for a user (real-time)
export function subscribeToUserChats(
    userId: string,
    callback: (chats: ChatDoc[]) => void
): Unsubscribe {
    const chatsRef = collection(db, 'chats');
    // Only filter by participants — sorting is done client-side
    // This avoids needing a Firestore composite index
    const q = query(
        chatsRef,
        where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const chats: ChatDoc[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                participants: data.participants,
                isGroup: data.isGroup,
                groupName: data.groupName,
                groupInfo: data.groupInfo || null,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                lastMessage: data.lastMessage
                    ? {
                        text: data.lastMessage.text,
                        senderId: data.lastMessage.senderId,
                        timestamp: data.lastMessage.timestamp instanceof Timestamp
                            ? data.lastMessage.timestamp.toDate()
                            : new Date(data.lastMessage.timestamp),
                    }
                    : null,
                unreadCount: data.unreadCount || {},
            };
        });

        // Sort by last message time, fallback to creation time
        chats.sort((a, b) => {
            const timeA = a.lastMessage?.timestamp?.getTime() || a.createdAt.getTime();
            const timeB = b.lastMessage?.timestamp?.getTime() || b.createdAt.getTime();
            return timeB - timeA;
        });

        callback(chats);
    }, (error) => {
        console.error('Error subscribing to chats:', error);
    });
}

// Reset unread count for a user in a chat
export async function resetUnreadCount(chatId: string, userId: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0,
    });
}
