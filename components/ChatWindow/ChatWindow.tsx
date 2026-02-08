"use client";

import { Phone, Video, Info } from 'lucide-react';
import styles from './ChatWindow.module.css';
import { Chat, Message } from '@/data/mockData';
import MessageInput from './MessageInput';
import { useEffect, useRef } from 'react';

interface ChatWindowProps {
    chat: Chat;
    onSendMessage: (text: string) => void;
}

export default function ChatWindow({ chat, onSendMessage }: ChatWindowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chat.messages]);

    const handleSendAttachment = () => {
        alert("Opening file picker... (Simulation)");
    };

    const getChatName = () => {
        if (chat.participants[0].id === 'me') return 'Saved Messages';
        return chat.isGroup ? chat.groupName : chat.participants[0].name;
    };

    const name = getChatName();
    const isOnline = !chat.isGroup && chat.participants[0].id !== 'me' && chat.participants[0].isOnline;

    const getAvatar = (id: string) => {
        // In Saved Messages, show 'Me' or 'JD' for messages, but maybe no avatar for self messages? 
        // Usually telegram shows no avatar for self, but let's keep it consistent.
        if (id === 'me') return 'JD';
        const p = chat.participants.find(u => u.id === id);
        return p ? (p.avatar || p.name.substring(0, 1).toUpperCase()) : '?';
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={`${styles.avatar} ${chat.participants[0].id === 'me' ? styles.savedAvatar : ''}`}>
                        {chat.participants[0].id === 'me' ? '★' : (chat.isGroup ? name?.substring(0, 2).toUpperCase() : getAvatar(chat.participants[0].id))}
                    </div>
                    <div>
                        <div className={styles.title}>{name}</div>
                        {isOnline && (
                            <div className={styles.status}>
                                <div className={styles.statusDot} />
                                Active now
                            </div>
                        )}
                        {chat.participants[0].id === 'me' && (
                            <div className={styles.status} style={{ color: 'var(--muted-foreground)' }}>
                                Keep your notes here
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.headerRight}>
                    {chat.participants[0].id !== 'me' && (
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
                {chat.messages.map((msg) => {
                    const isOwn = msg.senderId === 'me';
                    return (
                        <div key={msg.id} className={`${styles.messageRow} ${isOwn ? styles.own : styles.other}`}>
                            {!isOwn && <div className={styles.avatar}>{getAvatar(msg.senderId)}</div>}
                            <div className={styles.messageContent}>
                                <div className={styles.bubble}>
                                    {msg.text}
                                </div>
                                <span className={styles.messageTime} suppressHydrationWarning>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input */}
            <MessageInput onSendMessage={onSendMessage} onSendAttachment={handleSendAttachment} />
        </div>
    );
}
