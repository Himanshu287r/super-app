"use client";

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import OnlineUsersMap from '@/components/Services/OnlineUsersMap';
import styles from '../services.module.css';

export default function MapsPage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>Online Users Map</h1>
            </header>

            <div className={styles.content} style={{ padding: 0 }}>
                <OnlineUsersMap />
            </div>
        </div>
    );
}
