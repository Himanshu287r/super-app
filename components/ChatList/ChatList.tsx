"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, MoreVertical, Plus, Users, Bot, UserPlus, Bookmark, X } from 'lucide-react';
import styles from './ChatList.module.css';
import { Chat } from '@/data/mockData';

interface ChatListProps {
    chats: Chat[];
    onSelectChat: (chatId: string) => void;
    selectedChatId: string | null;
    onAddContact: () => void;
    onCreateGroup: () => void;
    onTalkToAI: () => void;
}

export default function ChatList({ chats, onSelectChat, selectedChatId, onAddContact, onCreateGroup, onTalkToAI }: ChatListProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getChatName = (chat: Chat) => {
        if (chat.participants[0].id === 'me') return 'Saved Messages';
        if (chat.isGroup) return chat.groupName;
        return chat.participants[0].name;
    };

    const getChatAvatar = (chat: Chat) => {
        if (chat.participants[0].id === 'me') {
            return <Bookmark size={20} color="white" />;
        }
        if (chat.isGroup) {
            return chat.groupName?.substring(0, 2).toUpperCase() || 'GR';
        }
        return chat.participants[0].avatar || chat.participants[0].name.substring(0, 1).toUpperCase();
    };

    const isOnline = (chat: Chat) => {
        if (chat.isGroup || chat.participants[0].id === 'me') return false;
        return chat.participants[0].isOnline;
    }

    const getLastMessage = (chat: Chat) => {
        if (chat.messages.length === 0) return 'No messages yet';
        return chat.messages[chat.messages.length - 1].text;
    }

    const getLastTime = (chat: Chat) => {
        if (chat.messages.length === 0) return '';
        return chat.messages[chat.messages.length - 1].timestamp;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Chats</h1>
                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={styles.addButton}
                        style={{ transform: showMenu ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    >
                        <Plus size={20} />
                    </button>

                    {showMenu && (
                        <div className={styles.menuDropdown}>
                            <button
                                className={styles.menuItem}
                                onClick={() => { setShowMenu(false); onAddContact(); }}
                            >
                                <UserPlus size={18} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>New Chat</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Add contact by email</div>
                                </div>
                            </button>

                            <div className={styles.menuDivider} />

                            <button
                                className={styles.menuItem}
                                onClick={() => { setShowMenu(false); onCreateGroup(); }}
                            >
                                <Users size={18} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>Create Group</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Team work</div>
                                </div>
                            </button>

                            <div className={styles.menuDivider} />

                            <button
                                className={styles.menuItem}
                                onClick={() => { setShowMenu(false); onTalkToAI(); }}
                            >
                                <Bot size={18} />
                                <div>
                                    <div style={{ fontWeight: 500 }}>Talk to AI</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Explore personalities</div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* <button style={{background:'none', border:'none', cursor: 'pointer', color: 'var(--muted-foreground)'}}>
                 <MoreVertical size={20} />
            </button> 
            Removed redundant menu
            */}
                </div>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                    <Search size={18} color="#9ca3af" />
                    <input
                        type="text"
                        placeholder="Search messages"
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.chatList}>
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`${styles.chatItem} ${selectedChatId === chat.id ? styles.active : ''}`}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <div className={styles.avatarWrapper}>
                            <div
                                className={`${styles.avatar} ${chat.isGroup ? styles.groupAvatar : ''}`}
                                style={chat.participants[0].id === 'me' ? { backgroundColor: '#3b82f6' } : {}}
                            >
                                {getChatAvatar(chat)}
                            </div>
                            {isOnline(chat) && <div className={styles.onlineBadge} />}
                        </div>

                        <div className={styles.chatContent}>
                            <div className={styles.topRow}>
                                <span className={styles.name}>{getChatName(chat)}</span>
                                <span className={styles.time} suppressHydrationWarning>{formatTime(getLastTime(chat))}</span>
                            </div>

                            <div className={styles.bottomRow}>
                                <span className={styles.lastMessage}>{getLastMessage(chat)}</span>
                                {chat.unreadCount > 0 && (
                                    <div className={styles.unreadBadge}>{chat.unreadCount}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
