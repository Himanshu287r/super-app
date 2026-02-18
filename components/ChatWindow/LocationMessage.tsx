"use client";

import { MapPin } from 'lucide-react';
import { MessageDoc } from '@/lib/services/messageService';
import styles from './LocationMessage.module.css';

interface LocationMessageProps {
    message: MessageDoc;
}

export default function LocationMessage({ message }: LocationMessageProps) {
    if (message.type !== 'location' || !message.location) {
        return null;
    }

    const { latitude, longitude, address } = message.location;
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;

    return (
        <div className={styles.locationContainer}>
            <div className={styles.locationHeader}>
                <MapPin size={20} />
                <span className={styles.locationLabel}>Location</span>
            </div>
            {address && (
                <p className={styles.address}>{address}</p>
            )}
            <div className={styles.mapPreview}>
                <iframe
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: '8px' }}
                    src={mapUrl}
                    loading="lazy"
                    allowFullScreen
                />
            </div>
            <a
                href={openStreetMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openButton}
            >
                Open in Maps
            </a>
            <p className={styles.coordinates}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
        </div>
    );
}
