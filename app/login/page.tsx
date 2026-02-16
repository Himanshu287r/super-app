"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Smartphone, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import styles from './login.module.css';
import { useAuth } from '@/context/AuthContext';

type AuthView = 'selection' | 'email-login' | 'email-signup' | 'phone' | 'phone-verify';

export default function LoginPage() {
    const router = useRouter();
    const {
        user,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneCode,
        verifyPhoneCode,
        clearError,
    } = useAuth();

    const [view, setView] = useState<AuthView>('selection');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        await signInWithGoogle();
        setIsSubmitting(false);
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await signInWithEmail(email, password);
        setIsSubmitting(false);
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) return;
        setIsSubmitting(true);
        await signUpWithEmail(email, password, displayName);
        setIsSubmitting(false);
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await sendPhoneCode(phone);
        setIsSubmitting(false);
        if (!error) {
            setView('phone-verify');
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await verifyPhoneCode(verificationCode);
        setIsSubmitting(false);
    };

    const switchView = (newView: AuthView) => {
        clearError();
        setView(newView);
    };

    if (loading && user) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.loadingSpinner}>
                        <Loader2 size={32} className={styles.spin} />
                        <p>Signing you in...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {view === 'selection' && (
                    <>
                        <h1 className={styles.title}>Welcome</h1>
                        <p className={styles.subtitle}>Sign in to continue to your chats</p>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <div className={styles.buttonGroup}>
                            <button
                                className={styles.button}
                                onClick={handleGoogleLogin}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className={styles.spin} />
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                Continue with Google
                            </button>

                            <button
                                className={styles.button}
                                onClick={() => switchView('email-login')}
                            >
                                <Mail size={20} />
                                Continue with Email
                            </button>

                            {/* Phone auth hidden temporarily — requires Firebase Blaze plan */}
                        </div>
                    </>
                )}

                {view === 'email-login' && (
                    <>
                        <button
                            className={styles.backButtonTop}
                            onClick={() => switchView('selection')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={styles.title}>Sign In</h1>
                        <p className={styles.subtitle}>Enter your email and password</p>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <form onSubmit={handleEmailLogin}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        className={styles.input}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    className={`${styles.button} ${styles.primaryButton}`}
                                    disabled={!email || !password || isSubmitting}
                                    style={{ opacity: (!email || !password || isSubmitting) ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={20} className={styles.spin} />
                                    ) : null}
                                    Sign In
                                </button>
                            </div>
                        </form>

                        <p className={styles.switchText}>
                            Don&apos;t have an account?{' '}
                            <button
                                className={styles.linkButton}
                                onClick={() => switchView('email-signup')}
                            >
                                Sign Up
                            </button>
                        </p>
                    </>
                )}

                {view === 'email-signup' && (
                    <>
                        <button
                            className={styles.backButtonTop}
                            onClick={() => switchView('email-login')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={styles.title}>Create Account</h1>
                        <p className={styles.subtitle}>Sign up to start chatting</p>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <form onSubmit={handleEmailSignup}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Display Name</label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    className={styles.input}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="At least 6 characters"
                                        className={styles.input}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeButton}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    className={`${styles.button} ${styles.primaryButton}`}
                                    disabled={!email || !password || !displayName || isSubmitting}
                                    style={{ opacity: (!email || !password || !displayName || isSubmitting) ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={20} className={styles.spin} />
                                    ) : null}
                                    Create Account
                                </button>
                            </div>
                        </form>

                        <p className={styles.switchText}>
                            Already have an account?{' '}
                            <button
                                className={styles.linkButton}
                                onClick={() => switchView('email-login')}
                            >
                                Sign In
                            </button>
                        </p>
                    </>
                )}

                {view === 'phone' && (
                    <>
                        <button
                            className={styles.backButtonTop}
                            onClick={() => switchView('selection')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={styles.title}>Phone Login</h1>
                        <p className={styles.subtitle}>We&apos;ll send you a verification code</p>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <form onSubmit={handleSendCode}>
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
                                    disabled={phone.length < 5 || isSubmitting}
                                    style={{ opacity: (phone.length < 5 || isSubmitting) ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={20} className={styles.spin} />
                                    ) : null}
                                    Send Verification Code
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {view === 'phone-verify' && (
                    <>
                        <button
                            className={styles.backButtonTop}
                            onClick={() => switchView('phone')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className={styles.title}>Verify Code</h1>
                        <p className={styles.subtitle}>Enter the 6-digit code sent to {phone}</p>

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <form onSubmit={handleVerifyCode}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Verification Code</label>
                                <input
                                    type="text"
                                    placeholder="123456"
                                    className={styles.input}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    maxLength={6}
                                    autoFocus
                                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                                />
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <button
                                    type="submit"
                                    className={`${styles.button} ${styles.primaryButton}`}
                                    disabled={verificationCode.length < 6 || isSubmitting}
                                    style={{ opacity: (verificationCode.length < 6 || isSubmitting) ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={20} className={styles.spin} />
                                    ) : null}
                                    Verify & Sign In
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>

            {/* Invisible reCAPTCHA container for phone auth */}
            <div id="recaptcha-container"></div>
        </div>
    );
}
