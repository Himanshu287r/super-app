import { MessageCircle } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState() {
    return (
        <div className={styles.container}>
            <div>
                <div className={styles.iconWrapper}>
                    <MessageCircle size={48} color="#9ca3af" />
                </div>
                <h2 className={styles.title}>Start a conversation</h2>
                <p className={styles.subtitle}>Select a chat from the sidebar or use the + button to start a new chat.</p>
            </div>
        </div>
    );
}
