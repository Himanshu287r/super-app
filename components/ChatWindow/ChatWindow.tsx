"use client";

import { Phone, Video, Info, Download, File as FileIcon, Play, Pause } from 'lucide-react';
import styles from './ChatWindow.module.css';
import { ChatDoc } from '@/lib/services/chatService';
import { MessageDoc, subscribeToMessages, markMessagesAsRead, sendFileMessage, sendPollMessage, sendLocationMessage, sendAudioMessage } from '@/lib/services/messageService';
import { UserProfile } from '@/lib/services/userService';
import { uploadFile, getMessageTypeFromFile } from '@/lib/services/storageService';
import { createCall, subscribeToIncomingCalls, CallDoc, updateCallStatus } from '@/lib/services/callService';
import { subscribeToTypingStatus } from '@/lib/services/typingService';
import MessageInput from './MessageInput';
import PollMessage from './PollMessage';
import LocationMessage from './LocationMessage';
import AudioMessage from './AudioMessage';
import PollModal from './PollModal';
import LocationModal from './LocationModal';
import CallModal from './CallModal';
import ProfilePanel from './ProfilePanel';
import GroupInfoPanel from './GroupInfoPanel';
import TypingIndicator from './TypingIndicator';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChatWindowProps {
    chat: ChatDoc;
    currentUserId: string;
    usersMap: Map<string, UserProfile>;
    onSendMessage: (text: string) => void;
}

export default function ChatWindow({ chat, currentUserId, usersMap, onSendMessage }: ChatWindowProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<MessageDoc[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [showPollModal, setShowPollModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showProfilePanel, setShowProfilePanel] = useState(false);
    const [showGroupInfoPanel, setShowGroupInfoPanel] = useState(false);
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [activeCall, setActiveCall] = useState<CallDoc | null>(null);
    const [incomingCalls, setIncomingCalls] = useState<CallDoc[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    // Subscribe to real-time messages
    useEffect(() => {
        setLoadingMessages(true);
        const unsubscribe = subscribeToMessages(chat.id, (newMessages) => {
            setMessages(newMessages);
            setLoadingMessages(false);
        });

        // Mark as read when opening chat
        markMessagesAsRead(chat.id, currentUserId);

        return () => unsubscribe();
    }, [chat.id, currentUserId]);

    // Auto-scroll to bottom on new messages or typing indicator
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, typingUsers]);

    // Mark as read whenever new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            markMessagesAsRead(chat.id, currentUserId);
        }
    }, [messages.length, chat.id, currentUserId]);

    // Subscribe to incoming calls
    useEffect(() => {
        const unsubscribe = subscribeToIncomingCalls(currentUserId, (calls) => {
            setIncomingCalls(calls);
            // Auto-show the first incoming call
            if (calls.length > 0 && !activeCall) {
                setActiveCall(calls[0]);
            }
        });

        return () => unsubscribe();
    }, [currentUserId, activeCall]);

    // Subscribe to typing status
    useEffect(() => {
        const unsubscribe = subscribeToTypingStatus(chat.id, currentUserId, (users) => {
            setTypingUsers(users);
        });

        return () => unsubscribe();
    }, [chat.id, currentUserId]);

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        setUploading(true);
        try {
            const { url, fileName, fileSize, fileType } = await uploadFile(file, chat.id, currentUserId);
            const messageType = getMessageTypeFromFile(file);
            await sendFileMessage(chat.id, currentUserId, url, fileName, fileSize, fileType, messageType);
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSelectDocument = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFileSelect(file);
        };
        input.click();
    };

    const handleSelectPhoto = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFileSelect(file);
        };
        input.click();
    };

    const handleCreatePoll = async (question: string, options: string[]) => {
        try {
            await sendPollMessage(chat.id, currentUserId, question, options);
        } catch (error) {
            console.error('Failed to create poll:', error);
            alert('Failed to create poll. Please try again.');
        }
    };

    const handleShareLocation = async (latitude: number, longitude: number, address?: string) => {
        try {
            await sendLocationMessage(chat.id, currentUserId, latitude, longitude, address);
        } catch (error) {
            console.error('Failed to share location:', error);
            alert('Failed to share location. Please try again.');
        }
    };

    const handleSendAudio = async (audioBlob: Blob, duration: number) => {
        setUploading(true);
        try {
            // Convert blob to File for upload
            const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
            const { url, fileName, fileSize } = await uploadFile(audioFile, chat.id, currentUserId);
            await sendAudioMessage(chat.id, currentUserId, url, fileName, fileSize, duration);
        } catch (error) {
            console.error('Failed to send audio:', error);
            alert('Failed to send audio. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleVoiceCall = async () => {
        if (!otherUser) return;
        try {
            const callId = await createCall(chat.id, currentUserId, otherUser.uid, 'voice');
            const call: CallDoc = {
                id: callId,
                chatId: chat.id,
                callerId: currentUserId,
                receiverId: otherUser.uid,
                type: 'voice',
                status: 'ringing',
                startedAt: null,
                endedAt: null,
                duration: null,
                createdAt: new Date(),
            };
            setActiveCall(call);
        } catch (error) {
            console.error('Failed to initiate call:', error);
            alert('Failed to start call. Please try again.');
        }
    };

    const handleVideoCall = async () => {
        if (!otherUser) return;
        try {
            const callId = await createCall(chat.id, currentUserId, otherUser.uid, 'video');
            const call: CallDoc = {
                id: callId,
                chatId: chat.id,
                callerId: currentUserId,
                receiverId: otherUser.uid,
                type: 'video',
                status: 'ringing',
                startedAt: null,
                endedAt: null,
                duration: null,
                createdAt: new Date(),
            };
            setActiveCall(call);
        } catch (error) {
            console.error('Failed to initiate call:', error);
            alert('Failed to start call. Please try again.');
        }
    };

    const handleEndCall = () => {
        setActiveCall(null);
    };

    const handleAnswerCall = () => {
        // Call is answered in CallModal component
        // This is just for state management
    };

    const handleRejectCall = () => {
        setActiveCall(null);
    };

    // Get the "other" user for direct chats
    const getOtherUser = (): UserProfile | null => {
        if (chat.isGroup) return null;
        const otherId = chat.participants.find(pid => pid !== currentUserId);
        if (!otherId) return null;
        return usersMap.get(otherId) || null;
    };

    const getChatName = (): string => {
        if (chat.isGroup) return chat.groupName || 'Group';
        const other = getOtherUser();
        return other?.displayName || 'Unknown User';
    };

    const name = getChatName();
    const otherUser = getOtherUser();
    const isOnline = !chat.isGroup && otherUser?.isOnline;

    const getUserName = (uid: string): string => {
        if (uid === currentUserId) return 'You';
        const u = usersMap.get(uid);
        return u?.displayName || 'Unknown';
    };

    const getAvatar = (uid: string): React.ReactNode => {
        if (uid === currentUserId) {
            return '•';
        }
        const u = usersMap.get(uid);
        if (u?.photoURL) {
            return (
                <img
                    src={u.photoURL}
                    alt={u.displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
            );
        }
        return u?.displayName?.substring(0, 1).toUpperCase() || '?';
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div 
                        className={styles.avatar}
                        onClick={() => {
                            if (!chat.isGroup && otherUser) {
                                setProfileUserId(otherUser.uid);
                                setShowProfilePanel(true);
                            }
                        }}
                        style={{ cursor: chat.isGroup ? 'default' : 'pointer' }}
                    >
                        {chat.isGroup
                            ? name?.substring(0, 2).toUpperCase()
                            : (otherUser?.photoURL ? (
                                <img
                                    src={otherUser.photoURL}
                                    alt={name}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                name?.substring(0, 1).toUpperCase()
                            ))
                        }
                    </div>
                    <div>
                        <div 
                            className={styles.title}
                            onClick={() => {
                                if (!chat.isGroup && otherUser) {
                                    setProfileUserId(otherUser.uid);
                                    setShowProfilePanel(true);
                                }
                            }}
                            style={{ cursor: chat.isGroup ? 'default' : 'pointer' }}
                        >
                            {name}
                        </div>
                        {isOnline && (
                            <div className={styles.status}>
                                <div className={styles.statusDot} />
                                Active now
                            </div>
                        )}
                        {chat.isGroup && (
                            <div className={styles.status} style={{ color: 'var(--muted-foreground)' }}>
                                {chat.participants.length} members
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.headerRight}>
                    {!chat.isGroup && (
                        <>
                            <button
                                className={styles.callButton}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleVoiceCall();
                                }}
                                title="Voice Call"
                            >
                                <Phone size={20} />
                            </button>
                            <button
                                className={styles.callButton}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleVideoCall();
                                }}
                                title="Video Call"
                            >
                                <Video size={20} />
                            </button>
                        </>
                    )}
                    <button
                        className={styles.infoButton}
                        onClick={() => {
                            if (chat.isGroup) {
                                setShowGroupInfoPanel(true);
                            } else if (otherUser) {
                                setProfileUserId(otherUser.uid);
                                setShowProfilePanel(true);
                            }
                        }}
                        title="Chat Info"
                    >
                        <Info size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea} ref={scrollRef}>
                {loadingMessages ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: 'var(--muted-foreground)',
                    }}>
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: 'var(--muted-foreground)',
                        flexDirection: 'column',
                        gap: '0.5rem',
                    }}>
                        <p style={{ fontSize: '1.1rem' }}>No messages yet</p>
                        <p style={{ fontSize: '0.85rem' }}>Send a message to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`${styles.messageRow} ${isOwn ? styles.own : styles.other}`}>
                                {!isOwn && <div className={styles.avatar}>{getAvatar(msg.senderId)}</div>}
                                <div className={styles.messageContent}>
                                    {/* Show sender name in group chats */}
                                    {chat.isGroup && !isOwn && (
                                        <span className={styles.senderName}>
                                            {getUserName(msg.senderId)}
                                        </span>
                                    )}
                                    <div className={styles.bubble}>
                                        {msg.type === 'poll' ? (
                                            <PollMessage message={msg} chatId={chat.id} currentUserId={currentUserId} />
                                        ) : msg.type === 'location' ? (
                                            <LocationMessage message={msg} />
                                        ) : msg.type === 'image' && msg.fileUrl ? (
                                            <div className={styles.fileMessage}>
                                                <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className={styles.imagePreview} />
                                                {msg.fileName && <p className={styles.fileName}>{msg.fileName}</p>}
                                            </div>
                                        ) : msg.type === 'video' && msg.fileUrl ? (
                                            <div className={styles.fileMessage}>
                                                <video src={msg.fileUrl} controls className={styles.videoPreview} />
                                                {msg.fileName && <p className={styles.fileName}>{msg.fileName}</p>}
                                            </div>
                                        ) : msg.type === 'file' && msg.fileUrl ? (
                                            <div className={styles.fileMessage}>
                                                <div className={styles.fileInfo}>
                                                    <FileIcon size={24} />
                                                    <div className={styles.fileDetails}>
                                                        <p className={styles.fileName}>{msg.fileName || 'Document'}</p>
                                                        {msg.fileSize && (
                                                            <p className={styles.fileSize}>
                                                                {(msg.fileSize / 1024).toFixed(1)} KB
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.downloadButton}
                                                >
                                                    <Download size={16} />
                                                    Download
                                                </a>
                                            </div>
                                        ) : msg.type === 'audio' && msg.fileUrl ? (
                                            <AudioMessage
                                                audioUrl={msg.fileUrl}
                                                duration={msg.audioDuration || 0}
                                                isOwn={isOwn}
                                            />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                    <span className={styles.messageTime} suppressHydrationWarning>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className={styles.messageRow}>
                        <div className={styles.avatar}>{getAvatar(typingUsers[0])}</div>
                        <div className={styles.messageContent}>
                            {chat.isGroup && typingUsers.length === 1 && (
                                <span className={styles.senderName}>
                                    {getUserName(typingUsers[0])}
                                </span>
                            )}
                            <TypingIndicator 
                                userName={
                                    chat.isGroup && typingUsers.length === 1
                                        ? getUserName(typingUsers[0])
                                        : typingUsers.length === 1
                                        ? getChatName()
                                        : `${typingUsers.length} people`
                                }
                                showName={chat.isGroup || typingUsers.length > 1}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <MessageInput
                chatId={chat.id}
                currentUserId={currentUserId}
                onSendMessage={onSendMessage}
                onSendAudio={handleSendAudio}
                onSelectDocument={handleSelectDocument}
                onSelectPhoto={handleSelectPhoto}
                onSelectPoll={() => setShowPollModal(true)}
                onSelectLocation={() => setShowLocationModal(true)}
            />

            {/* Modals */}
            <PollModal
                isOpen={showPollModal}
                onClose={() => setShowPollModal(false)}
                onCreatePoll={handleCreatePoll}
            />
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onShareLocation={handleShareLocation}
            />

            {/* Upload indicator */}
            {uploading && (
                <div className={styles.uploadIndicator}>
                    <div className={styles.spinner} />
                    <span>Uploading...</span>
                </div>
            )}

            {/* Call Modal */}
            {activeCall && (
                <CallModal
                    call={activeCall}
                    currentUserId={currentUserId}
                    otherUser={otherUser}
                    isIncoming={activeCall.receiverId === currentUserId}
                    onEndCall={handleEndCall}
                    onAnswer={handleAnswerCall}
                    onReject={handleRejectCall}
                />
            )}

            {/* Profile Panel */}
            <ProfilePanel
                isOpen={showProfilePanel}
                onClose={() => {
                    setShowProfilePanel(false);
                    setProfileUserId(null);
                }}
                userId={profileUserId}
                currentUserId={currentUserId}
            />

            {/* Group Info Panel */}
            <GroupInfoPanel
                isOpen={showGroupInfoPanel}
                onClose={() => setShowGroupInfoPanel(false)}
                chat={chat}
                currentUserId={currentUserId}
                usersMap={usersMap}
                onViewProfile={(userId) => {
                    setShowGroupInfoPanel(false);
                    setProfileUserId(userId);
                    setShowProfilePanel(true);
                }}
            />
        </div>
    );
}
