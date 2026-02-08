export interface User {
    id: string;
    name: string;
    avatar?: string;
    isAI?: boolean;
    isOnline?: boolean;
    about?: string;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string; // ISO string
    isRead: boolean;
    type?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
}

export interface Chat {
    id: string;
    participants: User[];
    messages: Message[];
    unreadCount: number;
    isGroup?: boolean;
    groupName?: string;
}

export const USERS: User[] = [
    { id: 'u1', name: 'Sarah Johnson', isOnline: true },
    { id: 'u2', name: 'Michael Chen', isOnline: true },
    { id: 'u3', name: 'Emma Wilson', isOnline: false },
    { id: 'u4', name: 'David Brown', isOnline: false },
    { id: 'u5', name: 'Alex', isOnline: false }, // For Team Discussion
    { id: 'me', name: 'JD', isOnline: true, about: 'Hey there!' },
    { id: 'ai1', name: 'Helpful Bot', isAI: true, isOnline: true, about: 'I am here to help.' },
    { id: 'ai2', name: 'Creative Writer', isAI: true, isOnline: true, about: 'I love stories.' },
    { id: 'ai3', name: 'Casual Buddy', isAI: true, isOnline: true, about: 'Just chilling.' },
];

export const INITIAL_CHATS: Chat[] = [
    {
        id: 'saved',
        participants: [USERS[5]], // 'me'
        unreadCount: 0,
        messages: [
            { id: 'm0', senderId: 'me', text: 'Welcome to your saved messages!', timestamp: new Date().toISOString(), isRead: true }
        ]
    },
    {
        id: 'c1',
        participants: [USERS[0]],
        unreadCount: 2,
        messages: [
            { id: 'm1', senderId: 'u1', text: 'Hey! Did you see the new designs?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: false }
        ]
    },
    {
        id: 'c2',
        participants: [USERS[1]],
        unreadCount: 0,
        messages: [
            { id: 'm2', senderId: 'u2', text: 'Perfect! Let\'s schedule a meeting', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), isRead: true }
        ]
    },
    {
        id: 'c5',
        participants: [USERS[4], USERS[0], USERS[1]], // Group
        isGroup: true,
        groupName: 'Team Discussion',
        unreadCount: 5,
        messages: [
            { id: 'm5', senderId: 'u5', text: 'Great work everyone!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: false }
        ]
    }
];
