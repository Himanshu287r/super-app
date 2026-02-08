"use client";

import Modal from './Modal';
import { useState } from 'react';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (email: string) => void;
}

export default function AddContactModal({ isOpen, onClose, onAdd }: AddContactModalProps) {
    const [email, setEmail] = useState('');

    const handleAdd = () => {
        onAdd(email);
        setEmail('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Contact">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--foreground)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                    Enter the email address or username of the person you want to add.
                </p>
                <input
                    type="text"
                    placeholder="Email or Username"
                    style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', background: 'var(--background)', color: 'var(--foreground)' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button
                    onClick={handleAdd}
                    disabled={!email}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: !email ? '#94a3b8' : '#0084ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: !email ? 'not-allowed' : 'pointer'
                    }}
                >
                    Send Invitation
                </button>
            </div>
        </Modal>
    );
}
