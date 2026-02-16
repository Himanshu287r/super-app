"use client";

import Modal from './Modal';
import { UserProfile } from '@/lib/services/userService';
import { useState } from 'react';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, participants: string[]) => void;
    currentUserId: string;
    usersMap: Map<string, UserProfile>;
}

export default function CreateGroupModal({ isOpen, onClose, onCreate, currentUserId, usersMap }: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Get available users (all users in usersMap except current user)
    const availableUsers = Array.from(usersMap.values()).filter(u => u.uid !== currentUserId);

    const toggleUser = (id: string) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(prev => prev.filter(uid => uid !== id));
        } else {
            setSelectedUsers(prev => [...prev, id]);
        }
    };

    const handleCreate = () => {
        onCreate(groupName, selectedUsers);
        setGroupName('');
        setSelectedUsers([]);
    };

    const handleClose = () => {
        setGroupName('');
        setSelectedUsers([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Group">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--foreground)' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Group Name</label>
                    <input
                        type="text"
                        placeholder="Enter group name"
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--background)', color: 'var(--foreground)' }}
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        Select Participants
                        {selectedUsers.length > 0 && (
                            <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>
                                ({selectedUsers.length} selected)
                            </span>
                        )}
                    </label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        {availableUsers.length === 0 ? (
                            <div style={{
                                padding: '1.5rem',
                                textAlign: 'center',
                                color: 'var(--muted-foreground)',
                                fontSize: '0.9rem',
                            }}>
                                No contacts available yet. Start some chats first!
                            </div>
                        ) : (
                            availableUsers.map(user => (
                                <div
                                    key={user.uid}
                                    style={{
                                        padding: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        background: selectedUsers.includes(user.uid) ? 'rgba(0, 132, 255, 0.08)' : 'transparent',
                                        transition: 'background 0.15s',
                                    }}
                                    onClick={() => toggleUser(user.uid)}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        color: '#64748b',
                                        overflow: 'hidden',
                                    }}>
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            user.displayName[0]?.toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500 }}>{user.displayName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                            {user.email || user.phoneNumber || ''}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                        border: selectedUsers.includes(user.uid) ? 'none' : '2px solid var(--border-color)',
                                        background: selectedUsers.includes(user.uid) ? '#0084ff' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        transition: 'all 0.15s',
                                    }}>
                                        {selectedUsers.includes(user.uid) && '✓'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <button
                    onClick={handleCreate}
                    disabled={!groupName || selectedUsers.length === 0}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: (!groupName || selectedUsers.length === 0) ? '#94a3b8' : '#0084ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: (!groupName || selectedUsers.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                >
                    Create Group
                </button>
            </div>
        </Modal>
    );
}
