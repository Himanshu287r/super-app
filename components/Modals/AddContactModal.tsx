"use client";

import Modal from './Modal';
import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (email: string) => void;
}

export default function AddContactModal({ isOpen, onClose, onAdd }: AddContactModalProps) {
    const [email, setEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleAdd = async () => {
        setIsSearching(true);
        await onAdd(email);
        setIsSearching(false);
        setEmail('');
    };

    const handleClose = () => {
        setEmail('');
        setIsSearching(false);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && email.includes('@')) {
            handleAdd();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Start New Chat">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--foreground)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                    Enter the email address of the person you want to chat with. They need to have an account on this app.
                </p>
                <div style={{ position: 'relative' }}>
                    <input
                        type="email"
                        placeholder="friend@example.com"
                        style={{
                            padding: '0.75rem',
                            paddingLeft: '2.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            outline: 'none',
                            background: 'var(--background)',
                            color: 'var(--foreground)',
                            width: '100%',
                            fontSize: '0.95rem',
                        }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--muted-foreground)',
                        }}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={!email.includes('@') || isSearching}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: (!email.includes('@') || isSearching) ? '#94a3b8' : '#0084ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: (!email.includes('@') || isSearching) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                >
                    {isSearching && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                    {isSearching ? 'Searching...' : 'Find & Start Chat'}
                </button>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        </Modal>
    );
}
