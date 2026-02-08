"use client";

import { MessageSquare, Phone, Compass, Clapperboard, Grid, Settings } from 'lucide-react';
import styles from './SidebarNav.module.css';
import { useRouter, usePathname } from 'next/navigation';

export default function SidebarNav() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className={styles.sidebar}>
            <div
                className={styles.avatar}
                onClick={() => router.push('/profile')}
                style={{ cursor: 'pointer' }}
                title="Edit Profile"
            >
                JD
            </div>

            <div
                className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
                onClick={() => router.push('/')}
            >
                <div className={styles.iconWrapper}>
                    <MessageSquare size={24} />
                </div>
                <span>Chats</span>
            </div>

            <div className={styles.navItem}>
                <div className={styles.iconWrapper}>
                    <Phone size={24} />
                </div>
                <span>Calls</span>
            </div>

            <div className={styles.navItem}>
                <div className={styles.iconWrapper}>
                    <Compass size={24} />
                </div>
                <span>Discover</span>
            </div>

            <div className={styles.navItem}>
                <div className={styles.iconWrapper}>
                    <Clapperboard size={24} />
                </div>
                <span>Reels</span>
            </div>

            <div className={styles.navItem}>
                <div className={styles.iconWrapper}>
                    <Grid size={24} />
                </div>
                <span>Services</span>
            </div>

            <div
                style={{ marginTop: 'auto' }}
                className={`${styles.navItem} ${isActive('/settings') ? styles.active : ''}`}
                onClick={() => router.push('/settings')}
            >
                <div className={styles.iconWrapper}>
                    <Settings size={24} />
                </div>
                <span>Settings</span>
            </div>
        </nav>
    );
}
