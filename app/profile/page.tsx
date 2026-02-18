"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera } from 'lucide-react';
import styles from './profile.module.css';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, getUser } from '@/lib/services/userService';
import { updateProfile } from 'firebase/auth';
import { uploadProfilePicture } from '@/lib/services/storageService';

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [about, setAbout] = useState('');
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [viewingOtherUser, setViewingOtherUser] = useState(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const chatId = searchParams.get('chatId');

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const userId = searchParams.get('userId');
        const isViewingOtherUser = userId && userId !== user.uid;

        if (isViewingOtherUser) {
            setViewingOtherUser(true);
            // Load other user's profile
            const loadOtherUserProfile = async () => {
                const profile = await getUser(userId);
                if (profile) {
                    setName(profile.displayName || '');
                    setAbout(profile.about || '');
                    setPhotoURL(profile.photoURL || null);
                    setUserEmail(profile.email || '');
                }
            };
            loadOtherUserProfile();
        } else {
            setViewingOtherUser(false);
            // Load current user's profile
            const loadProfile = async () => {
                const profile = await getUser(user.uid);
                if (profile) {
                    setName(profile.displayName || '');
                    setAbout(profile.about || '');
                    setPhotoURL(profile.photoURL || user.photoURL || null);
                } else {
                    setName(user.displayName || '');
                    setPhotoURL(user.photoURL || null);
                }
            };
            loadProfile();
        }
    }, [user, router, searchParams]);

    const handleAvatarClick = () => {
        if (!viewingOtherUser) {
            fileInputRef.current?.click();
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (viewingOtherUser) return;
        
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setUploadingPhoto(true);
        try {
            // Upload to Firebase Storage
            const url = await uploadProfilePicture(file, user.uid);
            
            // Update state immediately for preview
            setPhotoURL(url);

            // Update Firestore profile
            await updateUserProfile(user.uid, {
                photoURL: url,
            });

            // Update Firebase Auth profile
            await updateProfile(user, { photoURL: url });
        } catch (err: any) {
            console.error('Failed to upload profile picture:', err);
            alert(err.message || 'Failed to upload profile picture. Please try again.');
            // Reset photo URL on error
            setPhotoURL(user.photoURL || null);
        } finally {
            setUploadingPhoto(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSave = async () => {
        if (!user || viewingOtherUser) return;
        setSaving(true);
        try {
            // Update Firestore profile (photoURL is already saved when uploaded)
            await updateUserProfile(user.uid, {
                displayName: name,
                about,
            });
            // Update Firebase Auth profile (photoURL is already saved when uploaded)
            await updateProfile(user, { 
                displayName: name,
            });
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
                <button className={styles.backButton} onClick={() => {
                    if (chatId) {
                        router.push(`/?chatId=${chatId}`);
                    } else {
                        router.back();
                    }
                }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>{viewingOtherUser ? 'Profile' : 'Edit Profile'}</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatarWrapper}>
                        <div
                            className={styles.avatar}
                            style={{
                                backgroundImage: photoURL ? `url(${photoURL})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: uploadingPhoto ? 0.6 : 1,
                                cursor: viewingOtherUser ? 'default' : 'pointer',
                            }}
                            onClick={handleAvatarClick}
                        >
                            {!photoURL && name.charAt(0).toUpperCase()}
                        </div>
                        {!viewingOtherUser && (
                            <>
                                <div 
                                    className={styles.cameraOverlay}
                                    onClick={handleAvatarClick}
                                >
                                    <Camera size={20} />
                                </div>
                                {uploadingPhoto && (
                                    <div className={styles.uploadingOverlay}>
                                        <div className={styles.spinner}></div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        {viewingOtherUser ? userEmail : (user.email || user.phoneNumber || '')}
                    </p>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Name</label>
                    {viewingOtherUser ? (
                        <div className={styles.input} style={{ backgroundColor: 'var(--muted)', cursor: 'default' }}>
                            {name}
                        </div>
                    ) : (
                        <input
                            type="text"
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>About</label>
                    {viewingOtherUser ? (
                        <div className={styles.textarea} style={{ backgroundColor: 'var(--muted)', cursor: 'default', minHeight: '80px' }}>
                            {about || 'No about information'}
                        </div>
                    ) : (
                        <textarea
                            className={styles.textarea}
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                        />
                    )}
                </div>

                {!viewingOtherUser && (
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={saving}
                        style={{ opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                    </button>
                )}
            </div>
        </div>
    );
}
