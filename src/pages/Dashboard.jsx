import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import VideoCall from '../components/VideoCall';
import { useChat } from '../context/ChatContext';
import { PhoneIncoming, Video, Phone, MessageSquare, X } from 'lucide-react';

const Dashboard = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        return parseInt(localStorage.getItem('sidebarWidth')) || 320;
    });
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

    const { incomingCall, acceptCall, rejectCall, toasts, removeToast, currentRoom } = useChat();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height);
            } else {
                setViewportHeight(window.innerHeight);
            }
        };

        window.addEventListener('resize', handleResize);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }

        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
        };
    }, []);

    const handleMouseDown = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(200, Math.min(480, startWidth + deltaX));
            setSidebarWidth(newWidth);
            localStorage.setItem('sidebarWidth', newWidth.toString());
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Play synthesized ringing tone when call is incoming
    useEffect(() => {
        if (!incomingCall) return;

        let audioCtx;
        let intervalId;
        
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            const playRingTone = () => {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                osc1.type = 'sine';
                osc1.frequency.value = 440; // 440Hz standard ring
                osc2.type = 'sine';
                osc2.frequency.value = 480; // 480Hz dual tone ring

                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.6);

                osc1.connect(gainNode);
                osc2.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc1.start();
                osc2.start();

                setTimeout(() => {
                    try {
                        osc1.stop();
                        osc2.stop();
                    } catch (e) {}
                }, 1600);
            };

            // Play immediately and repeat
            playRingTone();
            intervalId = setInterval(playRingTone, 2200);
        } catch (e) {
            console.error("Web Audio API not supported or blocked", e);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (audioCtx) {
                try {
                    audioCtx.close();
                } catch (e) {}
            }
        };
    }, [incomingCall]);

    return (
        <div 
            style={{ height: `${viewportHeight}px` }}
            className="flex w-full bg-slate-950 text-slate-100 overflow-hidden relative"
        >
            {/* Background grid details */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none opacity-20"></div>

            {isMobile ? (
                !currentRoom ? (
                    <Sidebar width={sidebarWidth} />
                ) : (
                    <ChatArea />
                )
            ) : (
                <>
                    <Sidebar width={sidebarWidth} />
                    <div 
                        onMouseDown={handleMouseDown}
                        className="w-1.5 h-full hover:bg-indigo-500/50 cursor-col-resize active:bg-indigo-500 transition-colors select-none z-20 shrink-0 bg-slate-900/40 border-r border-slate-900/60"
                    />
                    <ChatArea />
                </>
            )}
            <VideoCall />

            {/* In-app Toast Notifications overlay lists */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm pointer-events-none">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-2xl animate-toast-in pointer-events-auto select-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-650/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <MessageSquare size={16} />
                        </div>
                        <div className="flex flex-col min-w-0 pr-6">
                            <span className="text-xs font-bold text-white truncate">{toast.title}</span>
                            <span className="text-[11px] text-slate-400 truncate">{toast.content}</span>
                        </div>
                        <button 
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-500 hover:text-slate-350 ml-auto shrink-0 p-1 hover:bg-slate-950/40 rounded-lg transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Premium Incoming Call Overlay */}
            {incomingCall && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 transition-all duration-300 hover:border-indigo-500/20">
                        
                        {/* Pulse Ring Indicator */}
                        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ring-glow"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-650 to-purple-650 rounded-full flex items-center justify-center shadow-lg border border-indigo-400/20 text-white">
                                {incomingCall.mediaType === 'video' ? <Video size={28} /> : <Phone size={28} />}
                            </div>
                        </div>

                        {/* Caller Info */}
                        <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mb-1">Incoming Call</span>
                        <h3 className="text-xl font-extrabold text-white mb-2 text-center truncate w-full px-2">
                            {incomingCall.callerName}
                        </h3>
                        <p className="text-xs text-slate-400 mb-8 font-medium">
                            wants to start a {incomingCall.mediaType} chat
                        </p>

                        {/* Control Buttons */}
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={rejectCall}
                                className="flex-1 py-3 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-450 text-xs font-bold transition-all duration-200 active:scale-[0.97]"
                            >
                                Reject
                            </button>
                            <button
                                onClick={acceptCall}
                                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/15 transition-all duration-200 active:scale-[0.97]"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
