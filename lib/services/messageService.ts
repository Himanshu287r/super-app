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
    type: 'text' | 'image' | 'video' | 'file' | 'poll' | 'location' | 'audio';
    audioDuration?: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    pollQuestion?: string;
    pollOptions?: { text: string; votes: string[] }[];
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
}

// Send a message to a chat
export async function sendMessage(
    chatId: string,
    senderId: string,
    text: string
): Promise<void> {
    await sendMessageWithType(chatId, senderId, 'text', text);
}

// Send a file message (image, video, or document)
export async function sendFileMessage(
    chatId: string,
    senderId: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    messageType: 'image' | 'video' | 'file'
): Promise<void> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const previewText = messageType === 'image' ? '📷 Photo' : messageType === 'video' ? '🎥 Video' : '📎 Document';

    await addDoc(messagesRef, {
        senderId,
        text: previewText,
        timestamp: serverTimestamp(),
        readBy: [senderId],
        type: messageType,
        fileUrl,
        fileName,
        fileSize,
        fileType,
    });

    await updateLastMessage(chatId, senderId, previewText);
}

// Send a poll message
export async function sendPollMessage(
    chatId: string,
    senderId: string,
    question: string,
    options: string[]
): Promise<void> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
        senderId,
        text: `📊 Poll: ${question}`,
        timestamp: serverTimestamp(),
        readBy: [senderId],
        type: 'poll',
        pollQuestion: question,
        pollOptions: options.map(opt => ({ text: opt, votes: [] })),
    });

    await updateLastMessage(chatId, senderId, `📊 Poll: ${question}`);
}

// Send a location message
export async function sendLocationMessage(
    chatId: string,
    senderId: string,
    latitude: number,
    longitude: number,
    address?: string
): Promise<void> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
        senderId,
        text: '📍 Location',
        timestamp: serverTimestamp(),
        readBy: [senderId],
        type: 'location',
        location: {
            latitude,
            longitude,
            address,
        },
    });

    await updateLastMessage(chatId, senderId, '📍 Location');
}

// Send an audio message
export async function sendAudioMessage(
    chatId: string,
    senderId: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
    duration: number
): Promise<void> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
        senderId,
        text: '🎤 Audio',
        timestamp: serverTimestamp(),
        readBy: [senderId],
        type: 'audio',
        fileUrl,
        fileName,
        fileSize,
        fileType: 'audio/webm',
        audioDuration: duration,
    });

    await updateLastMessage(chatId, senderId, '🎤 Audio');
}

// Vote on a poll option
export async function voteOnPoll(
    chatId: string,
    messageId: string,
    optionIndex: number,
    userId: string
): Promise<void> {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) return;

    const data = messageSnap.data();
    if (data.type !== 'poll' || !data.pollOptions) return;

    const pollOptions = [...data.pollOptions];
    
    // Remove user's vote from all options
    pollOptions.forEach(opt => {
        opt.votes = opt.votes.filter((uid: string) => uid !== userId);
    });

    // Add vote to selected option
    if (pollOptions[optionIndex]) {
        pollOptions[optionIndex].votes.push(userId);
    }

    await updateDoc(messageRef, {
        pollOptions,
    });
}

// Internal helper to update last message
async function updateLastMessage(chatId: string, senderId: string, text: string): Promise<void> {
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

// Send message with type (internal helper)
async function sendMessageWithType(
    chatId: string,
    senderId: string,
    type: MessageDoc['type'],
    text: string,
    extraData?: Record<string, any>
): Promise<void> {
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    await addDoc(messagesRef, {
        senderId,
        text,
        timestamp: serverTimestamp(),
        readBy: [senderId],
        type,
        ...extraData,
    });

    await updateLastMessage(chatId, senderId, text);
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
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                fileType: data.fileType,
                pollQuestion: data.pollQuestion,
                pollOptions: data.pollOptions,
                location: data.location,
                audioDuration: data.audioDuration,
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
