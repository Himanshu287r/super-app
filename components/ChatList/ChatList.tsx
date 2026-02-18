"use client";

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Users, Bot, UserPlus, Bookmark } from 'lucide-react';
import styles from './ChatList.module.css';
import { ChatDoc } from '@/lib/services/chatService';
import { UserProfile } from '@/lib/services/userService';

interface ChatListProps {
    chats: ChatDoc[];
    currentUserId: string;
    usersMap: Map<string, UserProfile>;
    onSelectChat: (chatId: string) => void;
    selectedChatId: string | null;
    onAddContact: () => void;
    onCreateGroup: () => void;
    onTalkToAI: () => void;
}

export default function ChatList({
    chats,
    currentUserId,
    usersMap,
    onSelectChat,
    selectedChatId,
    onAddContact,
    onCreateGroup,
    onTalkToAI,
}: ChatListProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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

    const formatTime = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get the "other" user in a direct chat
    const getOtherUser = (chat: ChatDoc): UserProfile | null => {
        const otherId = chat.participants.find(pid => pid !== currentUserId);
        if (!otherId) return null;
        return usersMap.get(otherId) || null;
    };

    const getChatName = (chat: ChatDoc): string => {
        if (chat.isGroup) return chat.groupName || 'Group';
        const otherUser = getOtherUser(chat);
        return otherUser?.displayName || 'Unknown User';
    };

    const getChatAvatar = (chat: ChatDoc): React.ReactNode => {
        if (chat.isGroup) {
            return chat.groupName?.substring(0, 2).toUpperCase() || 'GR';
        }
        const otherUser = getOtherUser(chat);
        if (otherUser?.photoURL) {
            return (
                <img
                    src={otherUser.photoURL}
                    alt={otherUser.displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
            );
        }
        return otherUser?.displayName?.substring(0, 1).toUpperCase() || '?';
    };

    const isOnline = (chat: ChatDoc): boolean => {
        if (chat.isGroup) return false;
        const otherUser = getOtherUser(chat);
        return otherUser?.isOnline || false;
    };

    const getLastMessage = (chat: ChatDoc): string => {
        if (!chat.lastMessage) return 'No messages yet';
        const isOwn = chat.lastMessage.senderId === currentUserId;
        const prefix = isOwn ? 'You: ' : '';
        return prefix + chat.lastMessage.text;
    };

    const getLastTime = (chat: ChatDoc): Date | null => {
        return chat.lastMessage?.timestamp || null;
    };

    const getUnreadCount = (chat: ChatDoc): number => {
        return chat.unreadCount[currentUserId] || 0;
    };

    // Filter chats by search query
    const filteredChats = searchQuery
        ? chats.filter(chat => {
            const name = getChatName(chat);
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        })
        : chats;

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
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Search by email</div>
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
                </div>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search chats"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.chatList}>
                {filteredChats.length === 0 && (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--muted-foreground)',
                        fontSize: '0.9rem',
                    }}>
                        {searchQuery ? 'No chats found' : 'No chats yet. Start a new conversation!'}
                    </div>
                )}
                {filteredChats.map((chat) => {
                    const unread = getUnreadCount(chat);
                    return (
                        <div
                            key={chat.id}
                            className={`${styles.chatItem} ${selectedChatId === chat.id ? styles.active : ''}`}
                            onClick={() => onSelectChat(chat.id)}
                        >
                            <div className={styles.avatarWrapper}>
                                <div
                                    className={`${styles.avatar} ${chat.isGroup ? styles.groupAvatar : ''}`}
                                >
                                    {getChatAvatar(chat)}
                                </div>
                                {isOnline(chat) && <div className={styles.onlineBadge} />}
                            </div>

                            <div className={styles.chatContent}>
                                <div className={styles.topRow}>
                                    <span className={styles.name}>{getChatName(chat)}</span>
                                    <span className={styles.time} suppressHydrationWarning>
                                        {formatTime(getLastTime(chat))}
                                    </span>
                                </div>

                                <div className={styles.bottomRow}>
                                    <span className={styles.lastMessage}>{getLastMessage(chat)}</span>
                                    {unread > 0 && (
                                        <div className={styles.unreadBadge}>{unread}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
