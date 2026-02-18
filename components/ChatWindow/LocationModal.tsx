"use client";

import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import styles from './LocationModal.module.css';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShareLocation: (latitude: number, longitude: number, address?: string) => void;
}

export default function LocationModal({ isOpen, onClose, onShareLocation }: LocationModalProps) {
    const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !location) {
            getCurrentLocation();
        }
    }, [isOpen]);

    const getCurrentLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Try to get address from reverse geocoding
                let address: string | undefined;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    const data = await response.json();
                    if (data.display_name) {
                        address = data.display_name;
                    }
                } catch (err) {
                    console.error('Failed to get address:', err);
                }

                setLocation({ lat: latitude, lng: longitude, address });
                setLoading(false);
            },
            (err) => {
                setError('Failed to get your location. Please make sure location permissions are enabled.');
                setLoading(false);
            }
        );
    };

    const handleShare = () => {
        if (location) {
            onShareLocation(location.lat, location.lng, location.address);
            setLocation(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Share Location</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner} />
                            <p>Getting your location...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.error}>
                            <p>{error}</p>
                            <button className={styles.retryButton} onClick={getCurrentLocation}>
                                Try Again
                            </button>
                        </div>
                    ) : location ? (
                        <div className={styles.locationInfo}>
                            <div className={styles.iconWrapper}>
                                <MapPin size={32} />
                            </div>
                            {location.address && (
                                <p className={styles.address}>{location.address}</p>
                            )}
                            <p className={styles.coordinates}>
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                            <div className={styles.mapPreview}>
                                <iframe
                                    width="100%"
                                    height="200"
                                    style={{ border: 0, borderRadius: '8px' }}
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.01},${location.lng + 0.01},${location.lat + 0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.shareButton}
                        onClick={handleShare}
                        disabled={!location || loading}
                    >
                        Share Location
                    </button>
                </div>
            </div>
        </>
    );
}
