"use client";

import { ArrowLeft, Moon, Sun, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import styles from './settings.module.css';

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();

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
            </div>
        </div>
    );
}
