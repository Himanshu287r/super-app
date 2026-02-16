"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import styles from './profile.module.css';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, getUser } from '@/lib/services/userService';
import { updateProfile } from 'firebase/auth';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [about, setAbout] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        // Load from Firestore
        const loadProfile = async () => {
            const profile = await getUser(user.uid);
            if (profile) {
                setName(profile.displayName || '');
                setAbout(profile.about || '');
            } else {
                setName(user.displayName || '');
            }
        };

        loadProfile();
    }, [user, router]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // Update Firestore profile
            await updateUserProfile(user.uid, {
                displayName: name,
                about,
            });
            // Update Firebase Auth profile
            await updateProfile(user, { displayName: name });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save profile:', err);
            alert('Failed to save profile. Please try again.');
        }
        setSaving(false);
    };

    if (!user) return null;

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
                    <div
                        className={styles.avatar}
                        style={{
                            backgroundImage: user.photoURL ? `url(${user.photoURL})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {!user.photoURL && name.charAt(0).toUpperCase()}
                    </div>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        {user.email || user.phoneNumber || ''}
                    </p>
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

                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={saving}
                    style={{ opacity: saving ? 0.7 : 1 }}
                >
                    {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
