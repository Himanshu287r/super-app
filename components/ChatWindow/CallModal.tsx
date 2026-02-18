"use client";

import { useEffect, useRef, useState } from 'react';
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff } from 'lucide-react';
import styles from './CallModal.module.css';
import { CallDoc, CallType, updateCallStatus } from '@/lib/services/callService';
import { WebRTCService } from '@/lib/services/webrtcService';
import { subscribeToSignaling, sendSignaling } from '@/lib/services/signalingService';
import { UserProfile } from '@/lib/services/userService';

interface CallModalProps {
    call: CallDoc | null;
    currentUserId: string;
    otherUser: UserProfile | null;
    isIncoming: boolean;
    onEndCall: () => void;
    onAnswer?: () => void;
    onReject?: () => void;
}

export default function CallModal({
    call,
    currentUserId,
    otherUser,
    isIncoming,
    onEndCall,
    onAnswer,
    onReject,
}: CallModalProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const webrtcRef = useRef<WebRTCService | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const signalingUnsubscribeRef = useRef<(() => void) | null>(null);

    const isCaller = call?.callerId === currentUserId;
    const callType: CallType = call?.type || 'voice';

    useEffect(() => {
        if (!call || call.status !== 'answered') return;

        // Start call duration timer
        durationIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [call?.status]);

    useEffect(() => {
        if (!call || call.status !== 'answered') return;

        // Initialize WebRTC when call is answered
        const initWebRTC = async () => {
            try {
                const isCaller = call.callerId === currentUserId;
                webrtcRef.current = new WebRTCService();

                // Set up connection state handler
                webrtcRef.current.onConnectionState((state) => {
                    setConnectionState(state);
                    if (state === 'disconnected' || state === 'failed') {
                        handleEndCall();
                    }
                });

                // Get local stream
                const localStream = await webrtcRef.current.getLocalStream(callType);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream;
                }

                // Handle remote stream
                webrtcRef.current.onRemoteStream((stream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                    }
                });

                // Set up ICE candidate handler
                webrtcRef.current.onIceCandidate(async (candidate) => {
                    const targetUserId = isCaller ? call.receiverId : call.callerId;
                    await sendSignaling(
                        call.id,
                        'ice-candidate',
                        currentUserId,
                        targetUserId,
                        undefined,
                        candidate.toJSON()
                    );
                });

                // Set up signaling listener
                signalingUnsubscribeRef.current = subscribeToSignaling(
                    call.id,
                    currentUserId,
                    {
                        onOffer: async (offer) => {
                            // Receiver receives offer
                            if (webrtcRef.current) {
                                const answer = await webrtcRef.current.createAnswer(offer);
                                await sendSignaling(call.id, 'answer', currentUserId, call.callerId, answer);
                            }
                        },
                        onAnswer: async (answer) => {
                            // Caller receives answer
                            if (webrtcRef.current) {
                                await webrtcRef.current.setRemoteDescription(answer);
                            }
                        },
                        onIceCandidate: async (candidate) => {
                            if (webrtcRef.current) {
                                await webrtcRef.current.addIceCandidate(candidate);
                            }
                        },
                    }
                );

                // If caller, create and send offer
                if (isCaller && webrtcRef.current) {
                    const offer = await webrtcRef.current.createOffer();
                    await sendSignaling(call.id, 'offer', currentUserId, call.receiverId, offer);
                }
            } catch (error) {
                console.error('Error initializing WebRTC:', error);
                alert('Failed to start call. Please check your microphone/camera permissions.');
                handleEndCall();
            }
        };

        initWebRTC();

        return () => {
            if (webrtcRef.current) {
                webrtcRef.current.cleanup();
            }
            if (signalingUnsubscribeRef.current) {
                signalingUnsubscribeRef.current();
                signalingUnsubscribeRef.current = null;
            }
        };
    }, [call?.status, callType, call?.id, call?.callerId, call?.receiverId, currentUserId]);

    const handleAnswer = async () => {
        if (!call || !onAnswer) return;
        await updateCallStatus(call.id, 'answered');
        if (onAnswer) onAnswer();
    };

    const handleReject = async () => {
        if (!call || !onReject) return;
        await updateCallStatus(call.id, 'rejected');
        if (webrtcRef.current) {
            webrtcRef.current.cleanup();
        }
        if (onReject) onReject();
    };

    const handleEndCall = async () => {
        if (!call) return;
        const duration = callDuration;
        await updateCallStatus(call.id, 'ended', duration);
        if (webrtcRef.current) {
            webrtcRef.current.cleanup();
        }
        onEndCall();
    };

    const toggleMute = () => {
        if (webrtcRef.current) {
            const stream = webrtcRef.current.getLocalStream();
            if (stream) {
                stream.getAudioTracks().forEach((track) => {
                    track.enabled = isMuted;
                });
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (webrtcRef.current && callType === 'video') {
            const stream = webrtcRef.current.getLocalStream();
            if (stream) {
                stream.getVideoTracks().forEach((track) => {
                    track.enabled = isVideoOff;
                });
                setIsVideoOff(!isVideoOff);
            }
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!call || !otherUser) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                {/* Remote video (full screen for video calls) */}
                {callType === 'video' && call.status === 'answered' && (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={styles.remoteVideo}
                    />
                )}

                {/* Local video (small preview for video calls) */}
                {callType === 'video' && call.status === 'answered' && (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={styles.localVideo}
                    />
                )}

                {/* Call info overlay */}
                <div className={styles.infoOverlay}>
                    {call.status === 'ringing' && (
                        <>
                            <div className={styles.avatar}>
                                {otherUser.photoURL ? (
                                    <img
                                        src={otherUser.photoURL}
                                        alt={otherUser.displayName}
                                        className={styles.avatarImage}
                                    />
                                ) : (
                                    <div className={styles.avatarInitials}>
                                        {otherUser.displayName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <h2 className={styles.name}>{otherUser.displayName}</h2>
                            <p className={styles.status}>
                                {isIncoming ? 'Incoming call' : 'Calling...'}
                            </p>
                        </>
                    )}

                    {call.status === 'answered' && (
                        <>
                            <div className={styles.avatar}>
                                {otherUser.photoURL ? (
                                    <img
                                        src={otherUser.photoURL}
                                        alt={otherUser.displayName}
                                        className={styles.avatarImage}
                                    />
                                ) : (
                                    <div className={styles.avatarInitials}>
                                        {otherUser.displayName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <h2 className={styles.name}>{otherUser.displayName}</h2>
                            <p className={styles.duration}>{formatDuration(callDuration)}</p>
                            <p className={styles.connectionState}>{connectionState}</p>
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    {call.status === 'ringing' && isIncoming && (
                        <>
                            <button
                                className={`${styles.controlButton} ${styles.rejectButton}`}
                                onClick={handleReject}
                            >
                                <PhoneOff size={24} />
                            </button>
                            <button
                                className={`${styles.controlButton} ${styles.answerButton}`}
                                onClick={handleAnswer}
                            >
                                {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
                            </button>
                        </>
                    )}

                    {call.status === 'ringing' && !isIncoming && (
                        <button
                            className={`${styles.controlButton} ${styles.endButton}`}
                            onClick={handleEndCall}
                        >
                            <PhoneOff size={24} />
                        </button>
                    )}

                    {call.status === 'answered' && (
                        <>
                            <button
                                className={`${styles.controlButton} ${isMuted ? styles.activeButton : ''}`}
                                onClick={toggleMute}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            {callType === 'video' && (
                                <button
                                    className={`${styles.controlButton} ${isVideoOff ? styles.activeButton : ''}`}
                                    onClick={toggleVideo}
                                >
                                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                            )}
                            <button
                                className={`${styles.controlButton} ${styles.endButton}`}
                                onClick={handleEndCall}
                            >
                                <PhoneOff size={24} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
