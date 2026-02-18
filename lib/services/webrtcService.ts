/**
 * WebRTC Service for handling peer-to-peer connections
 * This service manages WebRTC connections for voice and video calls
 */

export interface RTCConfig {
    iceServers: RTCIceServer[];
}

// Default STUN/TURN servers (you can use free services or set up your own)
const defaultRTCConfig: RTCConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for better connectivity (requires credentials)
        // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
    ],
};

export class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
    private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
    private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;

    constructor(config?: RTCConfig) {
        this.peerConnection = new RTCPeerConnection(config || defaultRTCConfig);
        this.setupPeerConnection();
    }

    private setupPeerConnection() {
        if (!this.peerConnection) return;

        // Handle incoming remote stream
        this.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                if (this.onRemoteStreamCallback) {
                    this.onRemoteStreamCallback(event.streams[0]);
                }
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            if (this.peerConnection && this.onConnectionStateChange) {
                this.onConnectionStateChange(this.peerConnection.connectionState);
            }
        };

        // Handle ICE candidate events
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidateCallback) {
                this.onIceCandidateCallback(event.candidate);
            }
        };
    }

    // Get local media stream (audio/video)
    async getLocalStream(type: 'voice' | 'video'): Promise<MediaStream> {
        const constraints: MediaStreamConstraints = {
            audio: true,
            video: type === 'video' ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
            } : false,
        };

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw new Error('Failed to access microphone/camera. Please check permissions.');
        }
    }

    // Add local stream tracks to peer connection
    addLocalTracks() {
        if (!this.peerConnection || !this.localStream) return;

        this.localStream.getTracks().forEach((track) => {
            if (this.peerConnection) {
                this.peerConnection.addTrack(track, this.localStream!);
            }
        });
    }

    // Create offer (caller side)
    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        this.addLocalTracks();
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    // Create answer (receiver side)
    async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        await this.peerConnection.setRemoteDescription(offer);
        this.addLocalTracks();
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    // Set remote description (caller receives answer)
    async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        await this.peerConnection.setRemoteDescription(description);
    }

    // Add ICE candidate
    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        await this.peerConnection.addIceCandidate(candidate);
    }

    // Set callbacks
    onRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
    }

    onConnectionState(callback: (state: RTCPeerConnectionState) => void) {
        this.onConnectionStateChange = callback;
    }

    onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
        this.onIceCandidateCallback = callback;
    }

    // Get remote stream
    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    // Get the currently active local stream (if any)
    getCurrentLocalStream(): MediaStream | null {
        return this.localStream;
    }

    // Stop all tracks and close connection
    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
        }

        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach((track) => track.stop());
            this.remoteStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }

    // Get connection state
    getConnectionState(): RTCPeerConnectionState | null {
        return this.peerConnection?.connectionState || null;
    }
}
