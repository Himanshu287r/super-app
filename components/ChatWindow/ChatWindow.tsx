"use client";

import { Phone, Video, Info } from 'lucide-react';
import styles from './ChatWindow.module.css';
import { ChatDoc } from '@/lib/services/chatService';
import { MessageDoc, subscribeToMessages, markMessagesAsRead } from '@/lib/services/messageService';
import { UserProfile } from '@/lib/services/userService';
import MessageInput from './MessageInput';
import { useEffect, useRef, useState } from 'react';

interface ChatWindowProps {
    chat: ChatDoc;
    currentUserId: string;
    usersMap: Map<string, UserProfile>;
    onSendMessage: (text: string) => void;
}

export default function ChatWindow({ chat, currentUserId, usersMap, onSendMessage }: ChatWindowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<MessageDoc[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);

    // Subscribe to real-time messages
    useEffect(() => {
        setLoadingMessages(true);
        const unsubscribe = subscribeToMessages(chat.id, (newMessages) => {
            setMessages(newMessages);
            setLoadingMessages(false);
        });

        // Mark as read when opening chat
        markMessagesAsRead(chat.id, currentUserId);

        return () => unsubscribe();
    }, [chat.id, currentUserId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Mark as read whenever new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            markMessagesAsRead(chat.id, currentUserId);
        }
    }, [messages.length, chat.id, currentUserId]);

    const handleSendAttachment = () => {
        alert("File uploads coming soon!");
    };

    // Get the "other" user for direct chats
    const getOtherUser = (): UserProfile | null => {
        if (chat.isGroup) return null;
        const otherId = chat.participants.find(pid => pid !== currentUserId);
        if (!otherId) return null;
        return usersMap.get(otherId) || null;
    };

    const getChatName = (): string => {
        if (chat.isGroup) return chat.groupName || 'Group';
        const other = getOtherUser();
        return other?.displayName || 'Unknown User';
    };

    const name = getChatName();
    const otherUser = getOtherUser();
    const isOnline = !chat.isGroup && otherUser?.isOnline;

    const getUserName = (uid: string): string => {
        if (uid === currentUserId) return 'You';
        const u = usersMap.get(uid);
        return u?.displayName || 'Unknown';
    };

    const getAvatar = (uid: string): React.ReactNode => {
        if (uid === currentUserId) {
            return '•';
        }
        const u = usersMap.get(uid);
        if (u?.photoURL) {
            return (
                <img
                    src={u.photoURL}
                    alt={u.displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
            );
        }
        return u?.displayName?.substring(0, 1).toUpperCase() || '?';
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.avatar}>
                        {chat.isGroup
                            ? name?.substring(0, 2).toUpperCase()
                            : (otherUser?.photoURL ? (
                                <img
                                    src={otherUser.photoURL}
                                    alt={name}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                name?.substring(0, 1).toUpperCase()
                            ))
                        }
                    </div>
                    <div>
                        <div className={styles.title}>{name}</div>
                        {isOnline && (
                            <div className={styles.status}>
                                <div className={styles.statusDot} />
                                Active now
                            </div>
                        )}
                        {chat.isGroup && (
                            <div className={styles.status} style={{ color: 'var(--muted-foreground)' }}>
                                {chat.participants.length} members
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.headerRight}>
                    {!chat.isGroup && (
                        <>
                            <Phone size={24} className={styles.headerIcon} />
                            <Video size={24} className={styles.headerIcon} />
                        </>
                    )}
                    <Info size={24} className={styles.headerIcon} />
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea} ref={scrollRef}>
                {loadingMessages ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: 'var(--muted-foreground)',
                    }}>
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: 'var(--muted-foreground)',
                        flexDirection: 'column',
                        gap: '0.5rem',
                    }}>
                        <p style={{ fontSize: '1.1rem' }}>No messages yet</p>
                        <p style={{ fontSize: '0.85rem' }}>Send a message to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`${styles.messageRow} ${isOwn ? styles.own : styles.other}`}>
                                {!isOwn && <div className={styles.avatar}>{getAvatar(msg.senderId)}</div>}
                                <div className={styles.messageContent}>
                                    {/* Show sender name in group chats */}
                                    {chat.isGroup && !isOwn && (
                                        <span className={styles.senderName}>
                                            {getUserName(msg.senderId)}
                                        </span>
                                    )}
                                    <div className={styles.bubble}>
                                        {msg.text}
                                    </div>
                                    <span className={styles.messageTime} suppressHydrationWarning>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <MessageInput onSendMessage={onSendMessage} onSendAttachment={handleSendAttachment} />
        </div>
    );
}
