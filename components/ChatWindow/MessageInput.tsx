"use client";

import { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, Square } from 'lucide-react';
import styles from './MessageInput.module.css';
import EmojiPicker from './EmojiPicker';
import AttachmentMenu from './AttachmentMenu';
import { setTypingStatus } from '@/lib/services/typingService';

interface MessageInputProps {
    chatId: string;
    currentUserId: string;
    onSendMessage: (text: string) => void;
    onSendAudio: (audioBlob: Blob, duration: number) => void;
    onSelectDocument: () => void;
    onSelectPhoto: () => void;
    onSelectPoll: () => void;
    onSelectLocation: () => void;
}

export default function MessageInput({
    chatId,
    currentUserId,
    onSendMessage,
    onSendAudio,
    onSelectDocument,
    onSelectPhoto,
    onSelectPoll,
    onSelectLocation,
}: MessageInputProps) {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSend = () => {
        if (text.trim()) {
            // Stop typing indicator when sending
            setTypingStatus(chatId, currentUserId, false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            
            onSendMessage(text);
            setText('');
            setShowEmojiPicker(false);
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setText(newText);

        // Set typing status when user types
        if (newText.trim()) {
            setTypingStatus(chatId, currentUserId, true);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing indicator after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                setTypingStatus(chatId, currentUserId, false);
                typingTimeoutRef.current = null;
            }, 2000);
        } else {
            // Stop typing if input is empty
            setTypingStatus(chatId, currentUserId, false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const duration = recordingTime;
                onSendAudio(audioBlob, duration);
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setRecordingTime(0);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Update recording time every second
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access denied. Please allow microphone access to record audio.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Clean up typing status on unmount
            setTypingStatus(chatId, currentUserId, false);
        };
    }, [chatId, currentUserId]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        const input = inputRef.current;
        if (input) {
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const newText = text.slice(0, start) + emoji + text.slice(end);
            setText(newText);
            
            // Focus back on input and set cursor position after emoji
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        } else {
            setText(text + emoji);
        }
    };

    return (
        <div className={styles.inputContainer}>
            <div className={styles.emojiWrapper}>
                <button 
                    ref={emojiButtonRef}
                    className={`${styles.iconButton} ${showEmojiPicker ? styles.active : ''}`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Add emoji"
                >
                    <Smile size={24} />
                </button>
                {showEmojiPicker && (
                    <EmojiPicker
                        onSelectEmoji={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                    />
                )}
            </div>

            <div className={styles.inputWrapper}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    className={styles.textInput}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                />
                <div className={styles.attachmentWrapper}>
                    <button
                        className={`${styles.iconButton} ${showAttachmentMenu ? styles.active : ''}`}
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        title="Attachments"
                    >
                        <Paperclip size={20} />
                    </button>
                    {showAttachmentMenu && (
                        <AttachmentMenu
                            onSelectDocument={onSelectDocument}
                            onSelectPhoto={onSelectPhoto}
                            onSelectPoll={onSelectPoll}
                            onSelectLocation={onSelectLocation}
                            onClose={() => setShowAttachmentMenu(false)}
                        />
                    )}
                </div>
            </div>

            {text.trim() ? (
                <button className={styles.sendButton} onClick={handleSend}>
                    <Send size={24} />
                </button>
            ) : (
                <button
                    className={`${styles.audioButton} ${isRecording ? styles.recording : ''}`}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        startRecording();
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        stopRecording();
                    }}
                    title={isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Hold to record audio'}
                >
                    {isRecording ? (
                        <>
                            <Square size={20} />
                            <span className={styles.recordingTime}>{formatTime(recordingTime)}</span>
                        </>
                    ) : (
                        <Mic size={24} />
                    )}
                </button>
            )}
        </div>
    );
}
