"use client";

import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
    userName?: string;
    showName?: boolean;
}

export default function TypingIndicator({ userName, showName = true }: TypingIndicatorProps) {
    return (
        <div className={styles.typingIndicator}>
            <div className={styles.typingBubble}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
            </div>
            {showName && userName && (
                <span className={styles.typingText}>{userName} is typing</span>
            )}
        </div>
    );
}
