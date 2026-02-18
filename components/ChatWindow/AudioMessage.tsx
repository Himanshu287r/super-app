"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import styles from './AudioMessage.module.css';

interface AudioMessageProps {
    audioUrl: string;
    duration: number;
    isOwn: boolean;
}

export default function AudioMessage({ audioUrl, duration, isOwn }: AudioMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`${styles.audioContainer} ${isOwn ? styles.own : styles.other}`}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
            <button className={styles.playButton} onClick={togglePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <div className={styles.audioInfo}>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <div className={styles.timeInfo}>
                    <span className={styles.currentTime}>{formatTime(currentTime)}</span>
                    <span className={styles.duration}>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}
