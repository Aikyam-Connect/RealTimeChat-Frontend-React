import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getWSUrl, getMyRooms, getMessages, createRoom, joinRoom, getAllUsers } from '../services/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [users, setAllUsers] = useState([]);

    // Call State
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null); // { targetId, isCaller }
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const peerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Initialize Data
    useEffect(() => {
        if (user) {
            fetchRooms();
            fetchUsers();
            connectWS();
        }
        return () => {
            if (socket) socket.close();
        }
    }, [user]);

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
    }

    const connectWS = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const ws = new WebSocket(getWSUrl(token));

        ws.onopen = () => {
            console.log('WS Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWSMessage(data);
        };

        ws.onclose = () => {
            console.log('WS User Disconnected');
        };

        setSocket(ws);
    };

    const handleWSMessage = async (data) => {
        switch (data.type) {
            case 'new_message':
                if (currentRoom && data.message.room_id === currentRoom.id) {
                    setMessages((prev) => [...prev, data.message]);
                }
                break;
            case 'incoming_call':
                setIncomingCall({ callerId: data.callerId, callerName: data.callerName });
                break;
            case 'call_accepted':
                handleCallAccepted(data.acceptorId);
                break;
            case 'offer':
                handleOffer(data);
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

    // Chat Functions
    const selectRoom = async (room) => {
        setCurrentRoom(room);
        const msgs = await getMessages(room.id);
        setMessages(msgs);
    };

    const sendMessage = (content) => {
        if (socket && currentRoom) {
            socket.send(JSON.stringify({ type: 'chat', roomId: currentRoom.id, content }));
        }
    };

    const createNewRoom = async (name, isGroup) => {
        await createRoom(name, isGroup);
        fetchRooms();
    }

    // WebRTC Functions
    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (e) {
            console.error("Error accessing media devices", e);
        }
    };

    const callUser = async (targetId) => {
        const stream = await startLocalStream();
        setActiveCall({ targetId, isCaller: true });

        // Send call request
        socket.send(JSON.stringify({ type: "call_user", targetId }));

        // Initialize Peer
        createPeer(targetId, true, stream);
    };

    const acceptCall = async () => {
        const stream = await startLocalStream();
        const targetId = incomingCall.callerId;
        setActiveCall({ targetId, isCaller: false });
        setIncomingCall(null);

        socket.send(JSON.stringify({ type: "accept_call", targetId }));

        createPeer(targetId, false, stream);
    };

    const createPeer = (targetId, isInitiator, stream) => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'candidate',
                    candidate: event.candidate,
                    targetId
                }));
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
                socket.send(JSON.stringify({ type: 'offer', sdp: offer, targetId }));
            });
        }
    };

    const handleOffer = async (data) => {
        // If we are not in a call yet (or already accepted), we need to set remote desc
        if (!peerRef.current) return;

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: 'answer', sdp: answer, targetId: data.senderId }));
    };

    const handleAnswer = async (data) => {
        if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
    };

    const handleCandidate = async (data) => {
        if (peerRef.current) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    const handleCallAccepted = (acceptorId) => {
        // Just UI update if needed, usually we wait for answer/candidates
    }

    const endCall = () => {
        if (peerRef.current) peerRef.current.close();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        setActiveCall(null);
        setLocalStream(null);
        setRemoteStream(null);
        peerRef.current = null;
    };

    return (
        <ChatContext.Provider value={{
            rooms, users, currentRoom, messages, selectRoom, sendMessage, createNewRoom,
            incomingCall, callUser, acceptCall, endCall, activeCall,
            localVideoRef, remoteVideoRef
        }}>
            {children}
        </ChatContext.Provider>
    );
};
