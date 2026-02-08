"use client";

import { useState } from 'react';
import { Smile, Paperclip, Send } from 'lucide-react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    onSendAttachment: () => void;
}

export default function MessageInput({ onSendMessage, onSendAttachment }: MessageInputProps) {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className={styles.inputContainer}>
            <button className={styles.iconButton}>
                <Smile size={24} />
            </button>

            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    className={styles.textInput}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className={styles.iconButton} onClick={onSendAttachment} title="Send Document">
                    <Paperclip size={20} />
                </button>
            </div>

            <button className={styles.sendButton} onClick={handleSend}>
                <Send size={24} />
            </button>
        </div>
    );
}
