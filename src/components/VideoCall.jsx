import React, { useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { 
    PhoneOff, 
    Mic, 
    MicOff, 
    Video as VideoIcon, 
    VideoOff, 
    Volume2, 
    User
} from 'lucide-react';

const VideoCall = () => {
    const { 
        activeCall, 
        localVideoRef, 
        remoteVideoRef, 
        localStream,
        remoteStream,
        endCall,
        isMicMuted,
        isCamDisabled,
        toggleMic,
        toggleCam,
        roomMembers
    } = useChat();

    // Bind streams to video elements when activeCall state changes and elements mount
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, activeCall, localVideoRef]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, activeCall, remoteVideoRef]);

    if (!activeCall) return null;

    const isVideo = activeCall.mediaType === 'video';
    const remoteUser = roomMembers.find(m => m.id === activeCall.targetId);

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Call Status Indicator */}
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 text-[10px] tracking-wider uppercase font-bold text-indigo-400">
                <Volume2 size={12} className="animate-pulse" />
                <span>Secure {isVideo ? 'Video' : 'Audio'} Call</span>
            </div>

            {/* Video / Audio Content Area */}
            <div className="relative w-full h-full max-w-6xl max-h-[80vh] flex flex-col md:flex-row items-center justify-center gap-6 p-6">
                {isVideo ? (
                    // Video Call UI
                    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-6">
                        {/* Remote Video (Main) */}
                        <div className="relative flex-1 w-full h-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800/60 shadow-2xl">
                            <video 
                                ref={remoteVideoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover" 
                            />
                            
                            {/* Overlay details for Remote */}
                            <div className="absolute bottom-6 left-6 text-white font-bold bg-slate-950/60 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800/60 flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                <span className="text-xs font-semibold">{remoteUser?.name || 'Remote User'}</span>
                            </div>
                        </div>

                        {/* Local Video (Floating or Side depending on view) */}
                        <div className="absolute top-6 right-6 w-32 h-44 md:w-44 md:h-60 bg-slate-950 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl transition-all duration-300 z-10 hover:border-indigo-400/50">
                            {isCamDisabled ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                                    <VideoOff size={24} />
                                </div>
                            ) : (
                                <video 
                                    ref={localVideoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover transform -scale-x-100" 
                                />
                            )}
                            <div className="absolute bottom-3 left-3 text-[10px] text-white bg-slate-950/60 backdrop-blur px-2 py-0.5 rounded-md border border-slate-800/50">
                                You
                            </div>
                        </div>
                    </div>
                ) : (
                    // Audio Call UI
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                            {/* Pulsing sound waves */}
                            <div className="absolute inset-0 bg-indigo-500/10 rounded-full voice-wave-1"></div>
                            <div className="absolute inset-0 bg-purple-500/10 rounded-full voice-wave-2"></div>
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-full voice-wave-3"></div>

                            {/* Center Profile Circle */}
                            <div className="relative w-40 h-40 bg-gradient-to-tr from-indigo-650 to-purple-650 rounded-full p-1 shadow-2xl border border-indigo-400/20">
                                <div className="w-full h-full bg-slate-950 rounded-full overflow-hidden flex items-center justify-center">
                                    {remoteUser?.picture ? (
                                        <img 
                                            src={remoteUser.picture} 
                                            alt={remoteUser.name} 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <User size={64} className="text-slate-600" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">
                            {remoteUser?.name || 'Remote User'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            {isMicMuted ? 'Muted' : 'Speaking...'}
                        </p>
                        
                        {/* Hidden audio tags for stream binding */}
                        <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                        <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
                    </div>
                )}
            </div>

            {/* Calling Control Panel Bar */}
            <div className="absolute bottom-10 flex gap-4 px-6 py-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl">
                {/* Microphone Mute Toggle */}
                <button
                    onClick={toggleMic}
                    className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        isMicMuted 
                            ? 'bg-rose-500/20 border-rose-500/30 text-rose-450 hover:bg-rose-500/30' 
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-950/80'
                    }`}
                    title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                >
                    {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Camera Toggle (Video calls only) */}
                {isVideo && (
                    <button
                        onClick={toggleCam}
                        className={`p-3.5 rounded-xl border transition-all duration-200 ${
                            isCamDisabled 
                                ? 'bg-rose-500/20 border-rose-500/30 text-rose-450 hover:bg-rose-500/30' 
                                : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-950/80'
                        }`}
                        title={isCamDisabled ? "Enable Camera" : "Disable Camera"}
                    >
                        {isCamDisabled ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                    </button>
                )}

                {/* Separator */}
                <div className="w-[1px] bg-slate-800 my-1"></div>

                {/* Hang Up Button */}
                <button
                    onClick={endCall}
                    className="p-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.96] rounded-xl text-white shadow-lg shadow-rose-600/15 transition-all duration-200 flex items-center justify-center"
                    title="End Call"
                >
                    <PhoneOff size={20} />
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
