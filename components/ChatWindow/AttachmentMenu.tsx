"use client";

import { File, Image, BarChart3, MapPin } from 'lucide-react';
import styles from './AttachmentMenu.module.css';

interface AttachmentMenuProps {
    onSelectDocument: () => void;
    onSelectPhoto: () => void;
    onSelectPoll: () => void;
    onSelectLocation: () => void;
    onClose: () => void;
}

export default function AttachmentMenu({
    onSelectDocument,
    onSelectPhoto,
    onSelectPoll,
    onSelectLocation,
    onClose,
}: AttachmentMenuProps) {
    const handleOptionClick = (callback: () => void) => {
        callback();
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.menu}>
                <button
                    className={styles.option}
                    onClick={() => handleOptionClick(onSelectDocument)}
                >
                    <File size={18} />
                    <span>Document</span>
                </button>
                <button
                    className={styles.option}
                    onClick={() => handleOptionClick(onSelectPhoto)}
                >
                    <Image size={18} />
                    <span>Photo & Video</span>
                </button>
                <button
                    className={styles.option}
                    onClick={() => handleOptionClick(onSelectPoll)}
                >
                    <BarChart3 size={18} />
                    <span>Poll</span>
                </button>
                <button
                    className={styles.option}
                    onClick={() => handleOptionClick(onSelectLocation)}
                >
                    <MapPin size={18} />
                    <span>Location</span>
                </button>
            </div>
        </>
    );
}
