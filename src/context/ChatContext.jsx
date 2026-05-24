import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { 
    getWSUrl, 
    getMyRooms, 
    getMessages, 
    createRoom, 
    joinRoom, 
    getAllUsers, 
    getOrCreateDirectRoom, 
    getRoomMembers 
} from '../services/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [roomMembers, setRoomMembers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [users, setAllUsers] = useState([]);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    
    // Typing state maps user_id -> { senderName, roomId }
    const [typingUsers, setTypingUsers] = useState({});

    // Toast Notifications State
    const [toasts, setToasts] = useState([]);

    // Call State
    const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, mediaType }
    const [activeCall, setActiveCall] = useState(null); // { targetId, isCaller, mediaType }
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCamDisabled, setIsCamDisabled] = useState(false);

    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Ref to hold latest state for WS callbacks
    const stateRef = useRef({
        currentRoom: null,
        localStream: null,
        activeCall: null
    });

    useEffect(() => {
        stateRef.current = { currentRoom, localStream, activeCall };
    }, [currentRoom, localStream, activeCall]);

    // Request desktop push notification permissions on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Initialize Data
    useEffect(() => {
        if (user) {
            fetchRooms();
            fetchUsers();
            connectWS();
        }
        return () => {
            if (socket) socket.close();
            if (localStream) localStream.getTracks().forEach(track => track.stop());
        }
    }, [user]);

    const addToast = (title, content, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, title, content, type }]);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchRooms = async () => {
        try {
            const data = await getMyRooms();
            setRooms(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await getAllUsers();
            setAllUsers(data);
        } catch (e) { console.error(e); }
    };

    const connectWS = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const url = getWSUrl(token);
        // Prevent multiple connections
        if (socket && socket.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('WS Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWSMessage(data, ws);
        };

        ws.onclose = () => {
            console.log('WS User Disconnected');
        };

        setSocket(ws);
    };

    // Pass ws instance directly to allow sending before state update if needed
    const handleWSMessage = async (data, ws) => {
        const { currentRoom, localStream, activeCall } = stateRef.current;

        switch (data.type) {
            case 'new_message':
                // Check if message belongs to active room
                if (currentRoom && data.message.room_id == currentRoom.id) {
                    setMessages((prev) => [...prev, data.message]);
                }

                // Desktop push notification (if window is blurred)
                if (document.hidden && data.message.sender_id !== user?.id) {
                    if (Notification.permission === 'granted') {
                        new Notification(data.message.sender_name, {
                            body: data.message.message_type === 'text' ? data.message.content : `Shared an attachment: [${data.message.message_type}]`,
                            icon: '/logo.png'
                        });
                    }
                }

                // In-app Toast alert (if message is from a different room)
                if ((!currentRoom || data.message.room_id != currentRoom.id) && data.message.sender_id !== user?.id) {
                    addToast(
                        data.message.sender_name, 
                        data.message.message_type === 'text' ? data.message.content : `Shared a file attachment`, 
                        'message'
                    );
                }
                break;

            case 'typing':
                setTypingUsers(prev => {
                    const next = { ...prev };
                    if (data.isTyping) {
                        next[data.senderId] = { senderName: data.senderName, roomId: data.roomId };
                    } else {
                        delete next[data.senderId];
                    }
                    return next;
                });
                break;

            case 'incoming_call':
                if (!activeCall) {
                    setIncomingCall({ 
                        callerId: data.callerId, 
                        callerName: data.callerName, 
                        mediaType: data.mediaType || 'video' 
                    });
                } else {
                    ws.send(JSON.stringify({ type: 'reject_call', targetId: data.callerId }));
                }
                break;
            case 'call_accepted':
                if (localStream) {
                    createPeer(data.acceptorId, true, localStream, ws);
                }
                break;
            case 'reject_call':
                addToast("Call Declined", "The user declined your invitation.", "error");
                cleanupCall();
                break;
            case 'cancel_call':
                setIncomingCall(null);
                cleanupCall();
                break;
            case 'end_call':
                cleanupCall();
                break;
            case 'offer':
                handleOffer(data, ws);
                break;
            case 'answer':
                handleAnswer(data);
                break;
            case 'candidate':
                handleCandidate(data);
                break;
            default:
                break;
        }
    };

    // Typing activity handler (debounced)
    const sendTypingStatus = (isTyping) => {
        if (socket && socket.readyState === WebSocket.OPEN && currentRoom) {
            socket.send(JSON.stringify({
                type: 'typing',
                roomId: currentRoom.id,
                isTyping
            }));
        }
    };

    const handleUserTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else {
            sendTypingStatus(true);
        }

        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
            typingTimeoutRef.current = null;
        }, 2200);
    };

    // Chat Functions
    const selectRoom = async (room) => {
        if (!room) {
            setCurrentRoom(null);
            setMessages([]);
            setRoomMembers([]);
            return;
        }
        setCurrentRoom(room);
        setIsMessagesLoading(true);
        try {
            const msgs = await getMessages(room.id);
            setMessages(msgs);
            const members = await getRoomMembers(room.id);
            setRoomMembers(members);
        } catch (e) {
            console.error("Error selecting room", e);
        } finally {
            setIsMessagesLoading(false);
        }
    };

    const selectDirectChat = async (targetUserId) => {
        try {
            const room = await getOrCreateDirectRoom(targetUserId);
            await fetchRooms();
            await selectRoom(room);
        } catch (e) {
            console.error("Error starting direct chat", e);
        }
    };

    const inviteUserToRoom = async (roomId, userId) => {
        try {
            await joinRoom(roomId, userId);
            const members = await getRoomMembers(roomId);
            setRoomMembers(members);
        } catch (e) {
            console.error("Error inviting user to room", e);
        }
    };

    const sendMessage = (content, customParams = {}) => {
        if (socket && currentRoom) {
            socket.send(JSON.stringify({ 
                type: 'chat', 
                roomId: currentRoom.id, 
                content,
                ...customParams
            }));
            
            // Clean up typing status immediately
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                sendTypingStatus(false);
                typingTimeoutRef.current = null;
            }
        }
    };

    const createNewRoom = async (name, isGroup) => {
        try {
            const room = await createRoom(name, isGroup);
            await fetchRooms();
            await selectRoom(room);
        } catch (e) {
            console.error("Error creating room", e);
        }
    };

    // WebRTC Functions
    const startLocalStream = async (isVideo) => {
        try {
            const constraints = { 
                video: isVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false, 
                audio: true 
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            setIsMicMuted(false);
            setIsCamDisabled(!isVideo);
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (e) {
            console.error("Error accessing media devices", e);
            return null;
        }
    };

    const callUser = async (targetId, isVideo = true) => {
        const stream = await startLocalStream(isVideo);
        if (!stream) return;

        setActiveCall({ targetId, isCaller: true, mediaType: isVideo ? 'video' : 'audio' });
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
                type: "call_user", 
                targetId, 
                mediaType: isVideo ? 'video' : 'audio' 
            }));
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        const targetId = incomingCall.callerId;
        const isVideo = incomingCall.mediaType === 'video';
        
        const stream = await startLocalStream(isVideo);
        if (!stream) return;

        setActiveCall({ targetId, isCaller: false, mediaType: incomingCall.mediaType });
        setIncomingCall(null);

        // Create peer first so we are ready for offer
        createPeer(targetId, false, stream, socket);

        // Then signal acceptance
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "accept_call", targetId }));
        }
    };

    const rejectCall = () => {
        if (!incomingCall) return;
        const targetId = incomingCall.callerId;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "reject_call", targetId }));
        }
        setIncomingCall(null);
    };

    const cancelCall = () => {
        if (!activeCall) return;
        const targetId = activeCall.targetId;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "cancel_call", targetId }));
        }
        cleanupCall();
    };

    const endCall = () => {
        if (activeCall && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "end_call", targetId: activeCall.targetId }));
        }
        cleanupCall();
    };

    const cleanupCall = () => {
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setActiveCall(null);
        setLocalStream(null);
        setRemoteStream(null);
        setIncomingCall(null);
        setIsMicMuted(false);
        setIsCamDisabled(false);
    };

    const createPeer = (targetId, isInitiator, stream, wsInstance) => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                const ws = wsInstance || socket;
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'candidate',
                        candidate: event.candidate,
                        targetId
                    }));
                }
            }
        };

        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        peerRef.current = peer;

        if (isInitiator) {
            peer.createOffer().then(offer => {
                peer.setLocalDescription(offer);
                const ws = wsInstance || socket;
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'offer', sdp: offer, targetId }));
                }
            });
        }
    };

    const handleOffer = async (data, wsInstance) => {
        if (!peerRef.current) return;

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        const ws = wsInstance || socket;
        if (ws) {
            ws.send(JSON.stringify({ type: 'answer', sdp: answer, targetId: data.senderId }));
        }
    };

    const handleAnswer = async (data) => {
        if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
    };

    const handleCandidate = async (data) => {
        if (peerRef.current) {
            try {
                await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        }
    };

    // Toggle Mic & Video Cam
    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMicMuted(!isMicMuted);
        }
    };

    const toggleCam = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCamDisabled(!isCamDisabled);
        }
    };

    return (
        <ChatContext.Provider value={{
            rooms, users, currentRoom, roomMembers, messages, selectRoom, selectDirectChat, 
            sendMessage, createNewRoom, inviteUserToRoom, typingUsers, handleUserTyping,
            toasts, removeToast, addToast, isMessagesLoading,
            incomingCall, callUser, acceptCall, rejectCall, cancelCall, endCall, activeCall,
            localVideoRef, remoteVideoRef, localStream, remoteStream,
            isMicMuted, isCamDisabled, toggleMic, toggleCam
        }}>
            {children}
        </ChatContext.Provider>
    );
};
