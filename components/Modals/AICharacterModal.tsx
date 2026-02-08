"use client";

import Modal from './Modal';
import { Bot, Sparkles, Coffee } from 'lucide-react';
import { useState } from 'react';

interface AICharacterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
}

const PERSONAS = [
    { id: 'ai1', name: 'Helpful Bot', description: 'Helpful and polite.', icon: Bot },
    { id: 'ai2', name: 'Creative Writer', description: 'Helps with brainstorming.', icon: Sparkles },
    { id: 'ai3', name: 'Casual Buddy', description: 'Just for chatting.', icon: Coffee },
];

export default function AICharacterModal({ isOpen, onClose, onSelect }: AICharacterModalProps) {

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Choose AI Personality">
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {PERSONAS.map((p) => {
                    const Icon = p.icon;
                    return (
                        <div
                            key={p.id}
                            style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '0.5rem',
                                transition: 'border-color 0.2s',
                                color: 'var(--foreground)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0084ff'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                            onClick={() => onSelect(p.id)}
                        >
                            <div style={{ background: '#f0f9ff', padding: '0.75rem', borderRadius: '50%', color: '#0084ff' }}>
                                <Icon size={24} />
                            </div>
                            <div style={{ fontWeight: '600' }}>{p.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.description}</div>
                        </div>
                    )
                })}
            </div>
        </Modal>
    );
}
