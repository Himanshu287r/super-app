"use client";

import { MessageSquare, Phone, Compass, Grid, Settings, LogOut } from 'lucide-react';
import styles from './SidebarNav.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { User } from 'firebase/auth';

interface SidebarNavProps {
    user: User;
    onLogout: () => void;
}

export default function SidebarNav({ user, onLogout }: SidebarNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    // Get user initials
    const getInitials = () => {
        const name = user.displayName || user.email || 'U';
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <nav className={styles.sidebar}>
            <div
                className={styles.avatar}
                onClick={() => router.push('/profile')}
                style={{
                    cursor: 'pointer',
                    backgroundImage: user.photoURL ? `url(${user.photoURL})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
                title="Edit Profile"
            >
                {!user.photoURL && getInitials()}
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

            <div
                className={`${styles.navItem} ${isActive('/services') ? styles.active : ''}`}
                onClick={() => router.push('/services')}
            >
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

            <div
                className={styles.navItem}
                onClick={onLogout}
                style={{ cursor: 'pointer' }}
                title="Logout"
            >
                <div className={styles.iconWrapper}>
                    <LogOut size={24} />
                </div>
                <span>Logout</span>
            </div>
        </nav>
    );
}
