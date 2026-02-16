"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
    PhoneAuthProvider,
    signInWithCredential,
    AuthError,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createOrUpdateUser } from '@/lib/services/userService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    sendPhoneCode: (phoneNumber: string) => Promise<void>;
    verifyPhoneCode: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Handle redirect result (fallback for when popup is blocked)
    useEffect(() => {
        getRedirectResult(auth)
            .then(async (result) => {
                if (result?.user) {
                    await createOrUpdateUser(result.user);
                }
            })
            .catch((err) => {
                console.error('Redirect result error:', err);
            });
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Create or update user in Firestore
                await createOrUpdateUser(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const signInWithGoogle = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            // Try popup first (most reliable in modern browsers)
            await signInWithPopup(auth, googleProvider);
        } catch (err: unknown) {
            const authError = err as AuthError;
            console.error('Google sign-in error:', authError.code, authError.message);

            // If popup was blocked or closed, fall back to redirect
            if (
                authError.code === 'auth/popup-blocked' ||
                authError.code === 'auth/popup-closed-by-user' ||
                authError.code === 'auth/cancelled-popup-request'
            ) {
                try {
                    await signInWithRedirect(auth, googleProvider);
                    return; // redirect will navigate away
                } catch (redirectErr: unknown) {
                    const message = redirectErr instanceof Error ? redirectErr.message : 'Failed to sign in with Google';
                    setError(message);
                }
            } else if (authError.code === 'auth/unauthorized-domain') {
                setError('This domain is not authorized for Google sign-in. Please contact the app admin.');
            } else {
                const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
                setError(message);
            }
            setLoading(false);
        }
    }, []);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign in';
            // Make error messages user-friendly
            if (message.includes('user-not-found')) {
                setError('No account found with this email. Please sign up first.');
            } else if (message.includes('wrong-password') || message.includes('invalid-credential')) {
                setError('Incorrect password. Please try again.');
            } else if (message.includes('invalid-email')) {
                setError('Please enter a valid email address.');
            } else {
                setError(message);
            }
            setLoading(false);
        }
    }, []);

    const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
        try {
            setError(null);
            setLoading(true);
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign up';
            if (message.includes('email-already-in-use')) {
                setError('An account with this email already exists. Try signing in.');
            } else if (message.includes('weak-password')) {
                setError('Password should be at least 6 characters.');
            } else if (message.includes('invalid-email')) {
                setError('Please enter a valid email address.');
            } else {
                setError(message);
            }
            setLoading(false);
        }
    }, []);

    const sendPhoneCode = useCallback(async (phoneNumber: string) => {
        try {
            setError(null);
            // Create invisible recaptcha
            const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
            });
            const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
            setConfirmationResult(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to send verification code';
            if (message.includes('invalid-phone-number')) {
                setError('Please enter a valid phone number with country code (e.g., +1234567890).');
            } else if (message.includes('too-many-requests')) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(message);
            }
        }
    }, []);

    const verifyPhoneCode = useCallback(async (code: string) => {
        try {
            setError(null);
            setLoading(true);
            if (!confirmationResult) {
                setError('No verification code was sent. Please try again.');
                setLoading(false);
                return;
            }
            await confirmationResult.confirm(code);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to verify code';
            if (message.includes('invalid-verification-code')) {
                setError('Invalid verification code. Please try again.');
            } else {
                setError(message);
            }
            setLoading(false);
        }
    }, [confirmationResult]);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign out';
            setError(message);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                signInWithGoogle,
                signInWithEmail,
                signUpWithEmail,
                sendPhoneCode,
                verifyPhoneCode,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
