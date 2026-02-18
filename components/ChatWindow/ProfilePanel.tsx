"use client";

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, X } from 'lucide-react';
import styles from './ProfilePanel.module.css';
import { useAuth } from '@/context/AuthContext';
import { getUser, updateUserProfile } from '@/lib/services/userService';
import { updateProfile } from 'firebase/auth';
import { uploadProfilePicture } from '@/lib/services/storageService';
import { UserProfile } from '@/lib/services/userService';

interface ProfilePanelProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    currentUserId: string;
}

export default function ProfilePanel({ isOpen, onClose, userId, currentUserId }: ProfilePanelProps) {
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !user) return;

        const isViewingOtherUser = userId && userId !== user.uid;

        setViewingOtherUser(!!isViewingOtherUser);
        setLoading(true);

        const loadProfile = async () => {
            const targetUserId = userId || user.uid;
            const profile = await getUser(targetUserId);
            
            if (profile) {
                setName(profile.displayName || '');
                setAbout(profile.about || '');
                setPhotoURL(profile.photoURL || null);
                setUserEmail(profile.email || '');
            } else if (!isViewingOtherUser) {
                setName(user.displayName || '');
                setPhotoURL(user.photoURL || null);
            }
            setLoading(false);
        };

        loadProfile();
    }, [isOpen, userId, user]);

    const handleAvatarClick = () => {
        if (!viewingOtherUser) {
            fileInputRef.current?.click();
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (viewingOtherUser || !user) return;
        
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setUploadingPhoto(true);
        try {
            const url = await uploadProfilePicture(file, user.uid);
            setPhotoURL(url);
            await updateUserProfile(user.uid, { photoURL: url });
            await updateProfile(user, { photoURL: url });
        } catch (err: any) {
            console.error('Failed to upload profile picture:', err);
            alert(err.message || 'Failed to upload profile picture. Please try again.');
            setPhotoURL(user.photoURL || null);
        } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSave = async () => {
        if (!user || viewingOtherUser) return;
        setSaving(true);
        try {
            await updateUserProfile(user.uid, {
                displayName: name,
                about,
            });
            await updateProfile(user, { displayName: name });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save profile:', err);
            alert('Failed to save profile. Please try again.');
        }
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.panel}>
                <header className={styles.header}>
                    <button className={styles.backButton} onClick={onClose}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className={styles.title}>{viewingOtherUser ? 'Profile' : 'Edit Profile'}</h1>
                </header>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                        <p>Loading profile...</p>
                    </div>
                ) : (
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
                            <p className={styles.email}>
                                {viewingOtherUser ? userEmail : (user?.email || user?.phoneNumber || '')}
                            </p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Name</label>
                            {viewingOtherUser ? (
                                <div className={styles.readOnlyField}>
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
                                <div className={styles.readOnlyField}>
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
                            >
                                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
