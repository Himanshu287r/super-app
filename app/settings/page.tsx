"use client";

import { ArrowLeft, Moon, Sun, Smartphone, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { setOnlineStatus } from '@/lib/services/userService';
import styles from './settings.module.css';

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        if (user) {
            await setOnlineStatus(user.uid, false);
        }
        await logout();
        router.push('/login');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>Settings</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Appearance</h2>
                    <div className={styles.card}>

                        <div className={styles.option} onClick={() => setTheme('light')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Sun size={20} />
                                <span className={styles.optionLabel}>Light Mode</span>
                            </div>
                            <div className={`${styles.radio} ${theme === 'light' ? styles.selected : ''}`} />
                        </div>

                        <div className={styles.option} onClick={() => setTheme('dark')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Moon size={20} />
                                <span className={styles.optionLabel}>Dark Mode</span>
                            </div>
                            <div className={`${styles.radio} ${theme === 'dark' ? styles.selected : ''}`} />
                        </div>

                        <div className={styles.option} onClick={() => setTheme('system')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Smartphone size={20} />
                                <span className={styles.optionLabel}>System Default</span>
                            </div>
                            <div className={`${styles.radio} ${theme === 'system' ? styles.selected : ''}`} />
                        </div>

                    </div>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Account</h2>
                    <div className={styles.card}>
                        {user && (
                            <div className={styles.option} style={{ cursor: 'default' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: '#e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        overflow: 'hidden',
                                    }}>
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt=""
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            (user.displayName || 'U')[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <span className={styles.optionLabel}>{user.displayName || 'User'}</span>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                                            {user.email || user.phoneNumber || ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div
                            className={styles.option}
                            onClick={handleLogout}
                            style={{ color: '#dc2626', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <LogOut size={20} />
                                <span className={styles.optionLabel} style={{ color: '#dc2626' }}>Sign Out</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
