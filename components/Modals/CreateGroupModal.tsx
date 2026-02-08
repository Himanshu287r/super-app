"use client";

import Modal from './Modal';
import { USERS } from '@/data/mockData';
import { useState } from 'react';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, participants: string[]) => void;
}

export default function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Include AI users now
    const availableUsers = USERS.filter(u => u.id !== 'me');

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
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Group">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'var(--foreground)' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Group Name</label>
                    <input
                        type="text"
                        placeholder="Enter group name"
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', background: 'var(--background)', color: 'var(--foreground)' }}
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Select Participants</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                        {availableUsers.map(user => (
                            <div
                                key={user.id}
                                style={{
                                    padding: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    borderBottom: '1px solid #f3f4f6',
                                    cursor: 'pointer',
                                    background: selectedUsers.includes(user.id) ? '#f0f9ff' : 'transparent'
                                }}
                                onClick={() => toggleUser(user.id)}
                            >
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                    {user.avatar || user.name[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ marginRight: '0.5rem' }}>{user.name}</span>
                                    {user.isAI && <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px' }}>AI</span>}
                                </div>
                            </div>
                        ))}
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
