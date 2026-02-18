import { MessageCircle } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState() {
    return (
        <div className={styles.container}>
            <div className={styles.stars} />
            <div className={styles.glow} />
            <div className={styles.card}>
                <div className={styles.iconOrbit}>
                    <div className={styles.iconBubble}>
                        <MessageCircle size={32} />
                    </div>
                </div>
                <h2 className={styles.title}>No chat selected</h2>
                <p className={styles.subtitle}>
                    Pick a conversation on the left or start a new one with the + button.
                </p>
                <div className={styles.hint}>
                    Your messages will appear here in real time.
                </div>
            </div>
        </div>
    );
}
