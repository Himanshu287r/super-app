"use client";

import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import styles from './GroupInfoPanel.module.css';
import { ChatDoc } from '@/lib/services/chatService';
import { UserProfile } from '@/lib/services/userService';

interface GroupInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    chat: ChatDoc;
    currentUserId: string;
    usersMap: Map<string, UserProfile>;
    onViewProfile: (userId: string) => void;
}

export default function GroupInfoPanel({ 
    isOpen, 
    onClose, 
    chat, 
    currentUserId, 
    usersMap,
    onViewProfile 
}: GroupInfoPanelProps) {
    if (!isOpen) return null;

    const getMemberProfile = (userId: string): UserProfile | null => {
        return usersMap.get(userId) || null;
    };

    const getAvatar = (user: UserProfile | null, userId: string): React.ReactNode => {
        if (user?.photoURL) {
            return (
                <img
                    src={user.photoURL}
                    alt={user.displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
            );
        }
        return user?.displayName?.substring(0, 1).toUpperCase() || '?';
    };

    const members = chat.participants.map(pid => ({
        userId: pid,
        profile: getMemberProfile(pid),
    }));

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.panel}>
                <header className={styles.header}>
                    <button className={styles.backButton} onClick={onClose}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className={styles.title}>Group Info</h1>
                </header>

                <div className={styles.content}>
                    <div className={styles.groupNameSection}>
                        <div className={styles.groupAvatar}>
                            {chat.groupName?.substring(0, 2).toUpperCase() || 'GR'}
                        </div>
                        <h2 className={styles.groupName}>{chat.groupName || 'Group'}</h2>
                        <p className={styles.memberCount}>{chat.participants.length} members</p>
                    </div>

                    {chat.groupInfo && (
                        <div className={styles.groupInfoSection}>
                            <h3 className={styles.sectionTitle}>About</h3>
                            <p className={styles.groupInfo}>{chat.groupInfo}</p>
                        </div>
                    )}

                    <div className={styles.membersSection}>
                        <h3 className={styles.sectionTitle}>Members</h3>
                        <div className={styles.membersList}>
                            {members.map(({ userId, profile }) => {
                                const isCurrentUser = userId === currentUserId;
                                const displayName = isCurrentUser 
                                    ? 'You' 
                                    : (profile?.displayName || 'Unknown User');
                                
                                return (
                                    <div
                                        key={userId}
                                        className={styles.memberItem}
                                        onClick={() => {
                                            if (!isCurrentUser) {
                                                onViewProfile(userId);
                                            }
                                        }}
                                        style={{ 
                                            cursor: isCurrentUser ? 'default' : 'pointer',
                                            opacity: isCurrentUser ? 0.7 : 1
                                        }}
                                    >
                                        <div className={styles.memberAvatar}>
                                            {getAvatar(profile, userId)}
                                        </div>
                                        <div className={styles.memberInfo}>
                                            <div className={styles.memberName}>{displayName}</div>
                                            {profile?.email && (
                                                <div className={styles.memberEmail}>{profile.email}</div>
                                            )}
                                        </div>
                                        {profile?.isOnline && !isCurrentUser && (
                                            <div className={styles.onlineIndicator} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
