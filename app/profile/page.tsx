"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import styles from './profile.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [about, setAbout] = useState('');

    useEffect(() => {
        // Load from local storage or mock defaults
        const savedName = localStorage.getItem('userName') || 'John Doe';
        const savedAbout = localStorage.getItem('userAbout') || 'Hey there! I am using Chat App.';
        setName(savedName);
        setAbout(savedAbout);
    }, []);

    const handleSave = () => {
        localStorage.setItem('userName', name);
        localStorage.setItem('userAbout', about);
        alert('Profile saved!');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>Edit Profile</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <button style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Change Profile Photo
                    </button>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Your Name</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>About</label>
                    <textarea
                        className={styles.textarea}
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                    />
                </div>

                <button className={styles.saveButton} onClick={handleSave}>
                    Save Changes
                </button>
            </div>
        </div>
    );
}
