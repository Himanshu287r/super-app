"use client";

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ServicesGrid from '@/components/Services/ServicesGrid';
import styles from './services.module.css';

export default function ServicesPage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>Services</h1>
            </header>

            <div className={styles.content}>
                <ServicesGrid />
            </div>
        </div>
    );
}
