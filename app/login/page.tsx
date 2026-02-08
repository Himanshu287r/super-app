"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Mail } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [method, setMethod] = useState<'selection' | 'phone'>('selection');
    const [phone, setPhone] = useState('');

    const handleGoogleLogin = () => {
        // Simulate Google Login
        localStorage.setItem('isLoggedIn', 'true');
        router.push('/');
    };

    const handlePhoneLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length > 5) {
            // Simulate Phone Login
            localStorage.setItem('isLoggedIn', 'true');
            router.push('/');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Sign in to continue to your chats</p>

                {method === 'selection' ? (
                    <div className={styles.buttonGroup}>
                        <button className={styles.button} onClick={handleGoogleLogin}>
                            <Mail size={20} />
                            Continue with Google
                        </button>
                        <button className={styles.button} onClick={() => setMethod('phone')}>
                            <Smartphone size={20} />
                            Continue with Phone
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handlePhoneLogin}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                className={styles.input}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <button
                                type="submit"
                                className={`${styles.button} ${styles.primaryButton}`}
                                disabled={phone.length < 5}
                                style={{ opacity: phone.length < 5 ? 0.7 : 1 }}
                            >
                                Send Code
                            </button>
                        </div>

                        <button type="button" className={styles.backButton} onClick={() => setMethod('selection')}>
                            Back to options
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
