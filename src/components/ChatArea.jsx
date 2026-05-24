import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../services/api';
import { 
    Send, 
    Phone, 
    Video, 
    UserPlus, 
    Users, 
    MessageSquare,
    Hash,
    X,
    FileText,
    Download,
    Paperclip,
    Mic,
    Smile,
    Trash2,
    Check,
    ArrowLeft,
    Play,
    Pause,
    ArrowDown
} from 'lucide-react';

const VoicePlayer = ({ src }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const getPlayableSrc = (url) => {
        if (!url) return url;
        const parts = url.split('.');
        const ext = parts[parts.length - 1].toLowerCase();
        if (url.includes('cloudinary') && ['webm', 'ogg', 'wav', 'm4a', 'aac', 'mp4'].includes(ext)) {
            parts[parts.length - 1] = 'mp3';
            return parts.join('.');
        }
        return url;
    };

    const playableSrc = getPlayableSrc(src);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            if (audio.duration === Infinity) {
                // Chromium WebM duration workaround to calculate duration by seeking to the end
                audio.currentTime = 1e101;
                const tempTimeUpdate = () => {
                    audio.currentTime = 0;
                    setDuration(audio.duration);
                    audio.removeEventListener('timeupdate', tempTimeUpdate);
                };
                audio.addEventListener('timeupdate', tempTimeUpdate);
            } else {
                setDuration(audio.duration);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        if (audio.duration) {
            setDuration(audio.duration);
        }

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.error("Audio playback failed", err);
            });
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;
        const seekTime = parseFloat(e.target.value);
        audio.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secVal = Math.floor(time % 60);
        return `${mins}:${secVal < 10 ? '0' : ''}${secVal}`;
    };

    return (
        <div className="flex items-center gap-3 bg-slate-900/85 border border-slate-800/60 rounded-2xl p-3 min-w-[260px] shadow-md select-none text-slate-100 animate-in fade-in duration-300">
            <audio ref={audioRef} src={playableSrc} preload="metadata" />
            
            <button 
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-all shadow-md shrink-0 active:scale-95"
            >
                {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
            </button>
            
            <div className="flex-1 flex flex-col gap-1 min-w-0">
                <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none outline-none"
                />
                <div className="flex justify-between text-[9px] text-slate-450 font-semibold font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};

const ChatArea = () => {
    const { 
        currentRoom, 
        roomMembers, 
        messages, 
        sendMessage, 
        inviteUserToRoom, 
        callUser,
        users,
        typingUsers,
        handleUserTyping,
        isMessagesLoading,
        addToast,
        selectRoom
    } = useChat();
    const { user } = useAuth();
    
    const [input, setInput] = useState("");
    const [showMembers, setShowMembers] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [inviteSearch, setInviteSearch] = useState("");
    
    // Viewport and drag-drop / scroll states
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
    
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [uploadingName, setUploadingName] = useState("");
    
    // Media Panels State
    const [showStickerPanel, setShowStickerPanel] = useState(false);
    const [gifQuery, setGifQuery] = useState("");
    const [gifResults, setGifResults] = useState([]);
    const [isSearchingGifs, setIsSearchingGifs] = useState(false);

    // Audio Recorder State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const recordIntervalRef = useRef(null);
    const shouldSendVoiceRef = useRef(true);
    
    const bottomRef = useRef(null);
    const listRef = useRef(null);
    const fileInputRef = useRef(null);

    // Derived values needed early in scroll effects
    const otherMember = currentRoom && !currentRoom.is_group && roomMembers.find(m => m.id !== user?.id);
    
    const typingUsersInRoom = currentRoom ? Object.keys(typingUsers)
        .filter(uid => typingUsers[uid].roomId == currentRoom.id && uid != user?.id)
        .map(uid => typingUsers[uid].senderName) : [];

    // Static Sticker Assets
    const stickersList = [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3o0N2oxNmN3MndmZTNwNndldmQyODRjbjJia2c1b2thODR1dTV5ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/L333CZZm6DasOOhlHk/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3lqejR0NG5icWNnYWN1czkyZHh5NXlnd2k4djM3eWp2bXB5bzlybyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/B3RLXFBw87F1M42vC1/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3A5MWN0NW1jczZ3N2FnaDNtdm84aWlhMW5nd3p4YXRvM3QwdmN1ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/gme1H2b98t061K31t1/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDMwdXBnZzJ4Nnd0eWVwYXNpdHR1aHhuYTRicmtndjYzbXFmYnE5MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/43v9Y5F9c869G1W4tT/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDVtdXphdzJ3ODN0bTcyZGNueHN5MWg4ZnBrZm1iZ2JibHNidDNsZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/sVl22MGhWniB6eMRsX/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWoxNHF1ZDNxM3R4cmYxeHN4eDVhOTVndnp6MngwZWN0aXo5N3RscCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Vf4y2A42rN39m/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmt0bXp6ZWR6am1hNXJvd3Nldm9xbjMxOWVsb2x6d3EydXRxdDFnZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Z1kpfgtH8ssHS/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3J1NWpqdjE5MnRrcWNrcWVxcml5dWdyYWYxaXV5cHdzZHRuNHU2YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/cZHNlE6xL2K08/giphy.gif"
    ];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleScroll = () => {
        const el = listRef.current;
        if (!el) return;
        
        const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 35;
        setIsAtBottom(isBottom);
        
        if (isBottom) {
            setUnreadCount(0);
            setShowScrollDownBtn(false);
        } else {
            setShowScrollDownBtn(true);
        }
    };

    const scrollToBottom = (behavior = 'smooth') => {
        if (listRef.current) {
            listRef.current.scrollTo({
                top: listRef.current.scrollHeight,
                behavior
            });
        }
    };

    useEffect(() => {
        if (messages.length === 0) return;
        
        const lastMsg = messages[messages.length - 1];
        const isMe = lastMsg.sender_id === user?.id;
        
        if (isMe || isAtBottom) {
            setTimeout(() => scrollToBottom('smooth'), 50);
            setUnreadCount(0);
            setShowScrollDownBtn(false);
        } else {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages]);

    useEffect(() => {
        if (isMessagesLoading) return;
        setTimeout(() => scrollToBottom('auto'), 50);
        setUnreadCount(0);
        setShowScrollDownBtn(false);
    }, [currentRoom, isMessagesLoading]);

    useEffect(() => {
        if (uploadProgress !== null) {
            setTimeout(() => scrollToBottom('smooth'), 50);
        }
    }, [uploadProgress]);

    useEffect(() => {
        if (typingUsersInRoom.length > 0 && isAtBottom) {
            setTimeout(() => scrollToBottom('smooth'), 50);
        }
    }, [typingUsersInRoom]);

    // Fetch trending Tenor GIFs on panel open
    useEffect(() => {
        if (showStickerPanel) {
            searchGifs("");
            if (isAtBottom) {
                setTimeout(() => scrollToBottom('smooth'), 100);
            }
        }
    }, [showStickerPanel]);

    // Public Keyless Tenor Search
    const searchGifs = async (query) => {
        setIsSearchingGifs(true);
        try {
            const url = query.trim() 
                ? `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDTRZGLBI2&limit=16`
                : `https://g.tenor.com/v1/trending?key=LIVDTRZGLBI2&limit=16`;
            const res = await fetch(url);
            const data = await res.json();
            
            const results = (data.results || []).map(item => {
                return {
                    url: item.media?.[0]?.gif?.url || item.media?.[0]?.nanogif?.url,
                    id: item.id
                };
            }).filter(item => item.url);
            
            setGifResults(results);
        } catch (e) {
            console.error("Tenor API fetch failed", e);
        }
        setIsSearchingGifs(false);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input.trim(), { msgType: "text" });
        setInput("");
    };

    // File Drag & Drop
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await uploadAndSendFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = async (e) => {
        if (e.target.files && e.target.files[0]) {
            await uploadAndSendFile(e.target.files[0]);
        }
    };

    const uploadAndSendFile = async (file) => {
        setUploadingName(file.name);
        setUploadProgress(1);
        try {
            const res = await uploadFile(file, (progress) => {
                setUploadProgress(progress);
            });
            
            let msgType = "file";
            if (file.type.startsWith("image/")) msgType = "image";
            else if (file.type.startsWith("video/")) msgType = "video";
            else if (file.type.startsWith("audio/")) msgType = "audio";
            
            sendMessage("", {
                msgType,
                fileUrl: res.file_url,
                fileName: res.file_name,
                fileSize: res.file_size
            });
            
            addToast("Upload Complete", `${file.name} sent successfully.`, "success");
        } catch (e) {
            console.error("Upload error", e);
            addToast("Upload Failed", "Could not complete file transfer.", "error");
        }
        setUploadProgress(null);
        setUploadingName("");
    };

    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/mp4',
            'audio/aac',
            'audio/wav'
        ];
        for (const type of types) {
            if (window.MediaRecorder && window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    };

    // Synchronous Voice Recorder
    const startRecording = async () => {
        try {
            const mimeType = getSupportedMimeType();
            const options = mimeType ? { mimeType } : undefined;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
                const blob = new Blob(chunks, { type: actualMimeType });
                if (shouldSendVoiceRef.current) {
                    let extension = 'webm';
                    if (actualMimeType.includes('ogg')) extension = 'ogg';
                    else if (actualMimeType.includes('mp4') || actualMimeType.includes('aac') || actualMimeType.includes('m4a')) extension = 'm4a';
                    else if (actualMimeType.includes('wav')) extension = 'wav';

                    const file = new File([blob], `voice.${extension}`, { type: actualMimeType });
                    setUploadingName("Voice Message");
                    setUploadProgress(10);
                    try {
                        const res = await uploadFile(file, (p) => setUploadProgress(p));
                        sendMessage("", {
                            msgType: "voice",
                            fileUrl: res.file_url,
                            fileName: res.file_name,
                            fileSize: res.file_size
                        });
                    } catch (e) {
                        console.error(e);
                        addToast("Upload Failed", "Could not send voice message.", "error");
                    }
                    setUploadProgress(null);
                    setUploadingName("");
                }
                stream.getTracks().forEach(t => t.stop());
            };

            setRecordingDuration(0);
            setIsRecording(true);
            shouldSendVoiceRef.current = true;
            mediaRecorder.start();

            recordIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (e) {
            console.error("Audio recording failed", e);
            addToast("Mic Access Denied", "Enable microphone permissions to send voice messages.", "error");
        }
    };

    const stopAndSendVoice = (shouldSend = true) => {
        if (!isRecording) return;
        clearInterval(recordIntervalRef.current);
        setIsRecording(false);
        shouldSendVoiceRef.current = shouldSend;
        
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    };

    const handleInputFocus = () => {
        if (isAtBottom) {
            setTimeout(() => scrollToBottom('smooth'), 120);
        }
    };

    const handleSendSticker = (url) => {
        sendMessage("", { msgType: "sticker", fileUrl: url });
        setShowStickerPanel(false);
    };

    const handleSendGif = (url) => {
        sendMessage("", { msgType: "gif", fileUrl: url });
        setShowStickerPanel(false);
    };

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-950/40 select-none">
                {/* Header Skeleton */}
                <div className="p-4 border-b border-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full skeleton shrink-0"></div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="w-28 h-3.5 rounded skeleton"></div>
                        <div className="w-16 h-2.5 rounded skeleton"></div>
                    </div>
                </div>
                {/* Message list Skeleton */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="flex gap-3.5 max-w-xs">
                        <div className="w-8 h-8 rounded-full skeleton self-end shrink-0"></div>
                        <div className="w-48 h-12 rounded-2xl rounded-tl-none skeleton"></div>
                    </div>
                    <div className="flex gap-3.5 max-w-xs ml-auto flex-row-reverse">
                        <div className="w-36 h-10 rounded-2xl rounded-tr-none skeleton"></div>
                    </div>
                    <div className="flex gap-3.5 max-w-xs">
                        <div className="w-8 h-8 rounded-full skeleton self-end shrink-0"></div>
                        <div className="w-56 h-14 rounded-2xl rounded-tl-none skeleton"></div>
                    </div>
                    <div className="flex gap-3.5 max-w-xs ml-auto flex-row-reverse">
                        <div className="w-40 h-12 rounded-2xl rounded-tr-none skeleton"></div>
                    </div>
                </div>
                {/* Input form Skeleton */}
                <div className="p-4 border-t border-slate-900 flex gap-3.5">
                    <div className="flex-1 h-12 rounded-2xl skeleton"></div>
                    <div className="w-12 h-12 rounded-2xl skeleton shrink-0"></div>
                </div>
            </div>
        );
    }

    if (!currentRoom) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-8 select-none">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-xl"></div>
                    <div className="relative w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-indigo-400">
                        <MessageSquare className="w-10 h-10 animate-bounce" style={{ animationDuration: '3s' }} />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-350 mb-2 font-sans">AIKYAM Connect</h3>
                <p className="text-xs text-slate-650 max-w-sm text-center leading-relaxed">
                    Select a private contact or active group channel from the sidebar to launch encrypted workspaces.
                </p>
            </div>
        );
    }

    const potentialInvites = users.filter(u => 
        u.id !== user?.id && 
        !roomMembers.some(m => m.id === u.id) &&
        (u.name || "").toLowerCase().includes(inviteSearch.toLowerCase())
    );

    return (
        <div 
            className="flex-1 flex h-full bg-slate-950/80 relative overflow-hidden"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
        >
            {/* Drag & Drop Highlight Panel */}
            {isDragging && (
                <div className="absolute inset-0 bg-slate-950/90 z-40 border-4 border-dashed border-indigo-500/40 m-4 rounded-3xl flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-full bg-indigo-650/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Paperclip size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Share File with Chat</h3>
                    <p className="text-xs text-slate-450">Drop any files here to upload instantly to Cloudinary CDN</p>
                </div>
            )}

            {/* Chat Frame */}
            <div className="flex-1 flex flex-col h-full bg-slate-950/40 relative z-10 border-r border-slate-900/40">
                
                {/* Chat Header */}
                <div className="p-4 bg-slate-950/40 backdrop-blur border-b border-slate-900 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                        {isMobile && (
                            <button 
                                type="button"
                                onClick={() => selectRoom(null)} 
                                className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900/50 transition-colors mr-1 shrink-0"
                                title="Back to chats"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        {currentRoom.is_group ? (
                            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                                <Hash size={18} />
                            </div>
                        ) : (
                            <img 
                                src={otherMember?.picture || 'https://via.placeholder.com/150'} 
                                alt={otherMember?.name || currentRoom.name} 
                                className="w-10 h-10 rounded-full border border-slate-800 shrink-0" 
                            />
                        )}
                        <div className="flex flex-col min-w-0">
                            <h2 
                                className="text-sm font-bold text-white truncate"
                                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '113px' }}
                            >
                                {currentRoom.is_group ? currentRoom.name : (otherMember?.name || currentRoom.name)}
                            </h2>
                            {currentRoom.is_group ? (
                                <button 
                                    onClick={() => setShowMembers(!showMembers)}
                                    className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                                >
                                    <Users size={12} />
                                    <span>{roomMembers.length} member{roomMembers.length !== 1 ? 's' : ''}</span>
                                </button>
                            ) : (
                                <span className="text-[10px] text-emerald-400 font-medium">Direct Chat</span>
                            )}
                        </div>
                    </div>

                    {/* Calling Controls */}
                    <div className="flex items-center gap-1.5">
                        {!currentRoom.is_group && otherMember && (
                            <>
                                <button 
                                    onClick={() => callUser(otherMember.id, false)} 
                                    className="p-2.5 rounded-xl bg-slate-900/50 hover:bg-indigo-650/20 text-slate-400 hover:text-indigo-455 border border-slate-800/80 transition-all duration-200"
                                >
                                    <Phone size={15} />
                                </button>
                                <button 
                                    onClick={() => callUser(otherMember.id, true)} 
                                    className="p-2.5 rounded-xl bg-slate-900/50 hover:bg-indigo-650/20 text-slate-400 hover:text-indigo-455 border border-slate-800/80 transition-all duration-200"
                                >
                                    <Video size={15} />
                                </button>
                            </>
                        )}
                        {currentRoom.is_group && (
                            <button 
                                onClick={() => { setShowAddMember(!showAddMember); setShowMembers(false); }}
                                className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/10 text-indigo-400 hover:bg-indigo-600/20 transition-all text-xs font-semibold flex items-center gap-1.5"
                            >
                                <UserPlus size={14} />
                                Add Member
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages Listing */}
                <div 
                    ref={listRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 scroll-smooth"
                >
                    {messages.length > 0 ? (
                        messages.map((msg, idx) => {
                            const isMe = msg.sender_id === user?.id;
                            const hasFile = msg.message_type && msg.message_type !== 'text';
                            let cleanFileName = msg.file_name || "";
                            if (cleanFileName.includes("|")) {
                                cleanFileName = cleanFileName.split("|")[0];
                            }

                            return (
                                <div 
                                    key={idx} 
                                    className={`flex gap-3.5 max-w-[85%] md:max-w-2xl animate-message-in ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                                >
                                    {!isMe && (
                                        <div className="shrink-0 self-end">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-indigo-405 font-bold uppercase">
                                                {msg.sender_name ? msg.sender_name.charAt(0) : '?'}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col">
                                        {!isMe && currentRoom.is_group && (
                                            <span className="text-[10px] text-indigo-450 font-bold mb-1 ml-1">
                                                {msg.sender_name}
                                            </span>
                                        )}
                                        
                                        {hasFile ? (
                                            <div className={`p-1.5 rounded-2xl border ${
                                                isMe 
                                                    ? 'bg-indigo-600/90 border-indigo-500/25 rounded-tr-none' 
                                                    : 'bg-slate-900 border-slate-800/80 rounded-tl-none'
                                            }`}>
                                                {msg.message_type === 'image' && (
                                                    <div className="max-w-xs overflow-hidden rounded-xl bg-slate-950">
                                                        <img 
                                                            src={msg.file_url} 
                                                            alt="Uploaded file" 
                                                            className="w-full h-auto max-h-60 object-cover cursor-zoom-in hover:scale-[1.03] transition-transform duration-300"
                                                        />
                                                    </div>
                                                )}

                                                {msg.message_type === 'video' && (
                                                    <div className="max-w-xs overflow-hidden rounded-xl bg-slate-950">
                                                        <video 
                                                            src={msg.file_url} 
                                                            controls 
                                                            className="w-full max-h-60 object-cover" 
                                                        />
                                                    </div>
                                                )}

                                                {(msg.message_type === 'audio' || msg.message_type === 'voice') && (
                                                    <div className="p-3 flex flex-col gap-2">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 flex items-center gap-1.5 ml-1">
                                                            <Mic size={12} className="text-indigo-405" />
                                                            {msg.message_type === 'voice' ? 'Voice note' : 'Audio note'}
                                                        </span>
                                                        <VoicePlayer src={msg.file_url} />
                                                    </div>
                                                )}

                                                {msg.message_type === 'sticker' && (
                                                    <div className="w-28 h-28 select-none">
                                                        <img src={msg.file_url} alt="Sticker" className="w-full h-full object-contain" />
                                                    </div>
                                                )}

                                                {msg.message_type === 'gif' && (
                                                    <div className="max-w-xs overflow-hidden rounded-xl select-none">
                                                        <img src={msg.file_url} alt="GIF" className="w-full h-auto object-cover" />
                                                    </div>
                                                )}

                                                {msg.message_type === 'file' && (
                                                    <div className="p-3.5 flex items-center gap-3 min-w-[220px]">
                                                        <div className="w-10 h-10 bg-slate-950/40 rounded-xl flex items-center justify-center text-slate-350">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="text-xs font-semibold truncate text-white">{cleanFileName}</span>
                                                            <span className="text-[9px] text-slate-450 font-medium">
                                                                {msg.file_size ? `${(msg.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={msg.file_url}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 rounded-lg bg-slate-950/30 hover:bg-slate-950/60 text-indigo-400 transition-colors"
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                                isMe 
                                                    ? 'bg-gradient-to-tr from-indigo-650 to-indigo-600 border border-indigo-500/20 text-white rounded-tr-none' 
                                                    : 'bg-slate-900 border border-slate-800/80 text-slate-100 rounded-tl-none'
                                            }`}>
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <div className="flex justify-end items-center gap-1 mt-1.5">
                                                    <span className={`text-[9px] font-medium tracking-wide ${
                                                        isMe ? 'text-indigo-305' : 'text-slate-500'
                                                    }`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-650 text-xs py-10">
                            <MessageSquare className="w-8 h-8 opacity-20 mb-2 animate-pulse" />
                            No messages in this chat. Start typing!
                        </div>
                    )}

                    {/* Inline Uploading Progress Bubble Placeholder */}
                    {uploadProgress !== null && (
                        <div className="flex gap-3.5 max-w-xs ml-auto flex-row-reverse animate-message-in">
                            <div className="flex flex-col items-end gap-1">
                                <div className="p-3.5 bg-indigo-650/40 border border-indigo-500/20 text-white rounded-2xl rounded-tr-none flex flex-col gap-2 min-w-[160px] shadow-lg">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">Uploading File...</span>
                                    <span className="text-xs truncate max-w-[130px] font-medium">{uploadingName}</span>
                                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-1">
                                        <div 
                                            className="h-full bg-white transition-all duration-300" 
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Typing Status Pulsing Bubble */}
                    {typingUsersInRoom.length > 0 && (
                        <div className="flex gap-2 items-center text-slate-500 text-xs bg-slate-900/30 py-2.5 px-4 rounded-full border border-slate-900 max-w-xs animate-in fade-in duration-200">
                            <span>{typingUsersInRoom.join(", ")} {typingUsersInRoom.length === 1 ? 'is' : 'are'} typing</span>
                            <div className="flex gap-1 items-center ml-1 shrink-0">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full typing-dot"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full typing-dot"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full typing-dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Floating Scroll Down Button */}
                {showScrollDownBtn && (
                    <button 
                        type="button"
                        onClick={() => {
                            scrollToBottom('smooth');
                            setUnreadCount(0);
                            setShowScrollDownBtn(false);
                        }}
                        className="absolute bottom-24 right-6 p-3 bg-slate-900/90 border border-slate-800/80 text-indigo-400 hover:text-indigo-300 hover:bg-slate-850 rounded-full shadow-2xl transition-all duration-200 z-30 flex items-center justify-center animate-bounce hover:scale-105 active:scale-95"
                        title="Scroll to bottom"
                    >
                        <ArrowDown size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-slate-900">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                )}

                {/* GIFs & Stickers Panel */}
                {showStickerPanel && (
                    <div className="h-64 bg-slate-950 border-t border-slate-900 flex flex-col z-20 animate-in slide-in-from-bottom duration-250 shrink-0">
                        {/* GIFs Search Input Bar */}
                        <div className="p-3 border-b border-slate-900 flex justify-between gap-4 items-center bg-slate-950/60 backdrop-blur">
                            <div className="flex-1 relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-400 focus-within:border-indigo-500/50">
                                <input
                                    type="text"
                                    value={gifQuery}
                                    onChange={(e) => { setGifQuery(e.target.value); searchGifs(e.target.value); }}
                                    placeholder="Search Tenor for animated GIFs..."
                                    className="bg-transparent text-xs w-full focus:outline-none text-slate-200"
                                />
                            </div>
                            <button 
                                onClick={() => setShowStickerPanel(false)}
                                className="text-slate-500 hover:text-slate-350 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Stickers/GIFs Grids Split */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Stickers column list */}
                            <div className="w-1/4 border-r border-slate-900 p-3 overflow-y-auto flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Stickers</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {stickersList.map((url, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSendSticker(url)}
                                            className="w-12 h-12 hover:scale-[1.1] transition-transform cursor-pointer overflow-hidden p-0.5 rounded-lg hover:bg-slate-900/40"
                                        >
                                            <img src={url} alt={`Sticker ${idx}`} className="w-full h-full object-contain" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* GIF search list */}
                            <div className="flex-1 p-3 overflow-y-auto">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">GIF search results</span>
                                {isSearchingGifs ? (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-650">
                                        Querying Tenor index...
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {gifResults.map((gif, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => handleSendGif(gif.url)}
                                                className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer bg-slate-900 border border-slate-800 hover:scale-[1.04] transition-all hover:border-indigo-500/20"
                                            >
                                                <img src={gif.url} alt="GIF" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Action bottom bar */}
                <div className="p-2.5 md:p-4 bg-slate-950/60 border-t border-slate-900 flex gap-2 md:gap-3 items-center relative z-10 shrink-0">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                    />
                    
                    {/* Upload attachment trigger button */}
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 md:p-3 bg-slate-900/50 hover:bg-indigo-650/20 border border-slate-800/80 text-slate-450 hover:text-indigo-400 rounded-2xl transition-all"
                        title="Upload file attachment"
                    >
                        <Paperclip size={16} />
                    </button>

                    {/* Stickers trigger button */}
                    <button 
                        type="button"
                        onClick={() => setShowStickerPanel(!showStickerPanel)}
                        className={`p-2.5 md:p-3 border rounded-2xl transition-all ${
                            showStickerPanel 
                                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' 
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-450 hover:text-indigo-400'
                        }`}
                        title="Stickers and GIFs"
                    >
                        <Smile size={16} />
                    </button>

                    {/* Recording visuals waveform */}
                    {isRecording ? (
                        <div className="flex-1 bg-rose-600/10 border border-rose-500/20 rounded-2xl px-3 md:px-4 py-2 md:py-3 flex justify-between items-center text-rose-450 animate-pulse">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                <Mic size={14} className="animate-bounce" />
                                <span>Recording Voice: {recordingDuration}s</span>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => stopAndSendVoice(false)} 
                                    className="p-1.5 rounded bg-slate-950/40 text-slate-450 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 size={15} />
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => stopAndSendVoice(true)} 
                                    className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                                >
                                    <Check size={15} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex-1 flex gap-2 md:gap-3 items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => { setInput(e.target.value); handleUserTyping(); }}
                                onFocus={handleInputFocus}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-900/60 border border-slate-800 text-slate-100 py-2.5 md:py-3.5 px-3 md:px-4 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10 placeholder-slate-650 transition-all duration-200"
                            />
                            
                            {/* Voice Record trigger button */}
                            {!input.trim() ? (
                                <button 
                                    type="button"
                                    onClick={startRecording}
                                    className="p-2.5 md:p-3.5 bg-slate-900/50 hover:bg-rose-650/20 border border-slate-800/80 text-slate-450 hover:text-rose-455 rounded-2xl transition-all animate-in fade-in"
                                >
                                    <Mic size={16} />
                                </button>
                            ) : (
                                <button 
                                    type="submit" 
                                    className="p-2.5 md:p-3.5 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-700 active:scale-[0.97] transition-all duration-200 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/15"
                                >
                                    <Send size={16} />
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>

            {/* Sidebar Slide-in Panel: Room Members */}
            {showMembers && currentRoom.is_group && (
                <div className="absolute md:relative right-0 top-0 w-full sm:w-64 bg-slate-950 border-l border-slate-900 p-4 flex flex-col h-full animate-in slide-in-from-right duration-250 z-20 shadow-2xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-900">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Users size={14} />
                            Room Members
                        </h3>
                        <button onClick={() => setShowMembers(false)} className="text-slate-500 hover:text-slate-350">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {roomMembers.map(m => (
                            <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/20 border border-transparent">
                                <img src={m.picture || 'https://via.placeholder.com/150'} alt={m.name} className="w-8 h-8 rounded-full border border-slate-800" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-medium text-slate-200 truncate">{m.name}</span>
                                    <span className="text-[9px] text-slate-500 truncate">{m.id === currentRoom.created_by ? 'Creator' : 'Member'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sidebar Slide-in Panel: Add Member */}
            {showAddMember && currentRoom.is_group && (
                <div className="absolute md:relative right-0 top-0 w-full sm:w-64 bg-slate-950 border-l border-slate-900 p-4 flex flex-col h-full animate-in slide-in-from-right duration-250 z-20 shadow-2xl">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-900">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <UserPlus size={14} />
                            Add Member
                        </h3>
                        <button onClick={() => setShowAddMember(false)} className="text-slate-500 hover:text-slate-350">
                            <X size={16} />
                        </button>
                    </div>
                    <input
                        type="text"
                        value={inviteSearch}
                        onChange={(e) => setInviteSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/40 mb-3"
                    />
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {potentialInvites.length > 0 ? (
                            potentialInvites.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-900/30 border border-slate-850/60 rounded-xl hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <img src={u.picture || 'https://via.placeholder.com/150'} alt={u.name} className="w-7 h-7 rounded-full border border-slate-800" />
                                        <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">{u.name}</span>
                                    </div>
                                    <button
                                        onClick={() => inviteUserToRoom(currentRoom.id, u.id)}
                                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150"
                                    >
                                        <UserPlus size={12} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-[10px] text-slate-600">
                                No users to invite
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatArea;
