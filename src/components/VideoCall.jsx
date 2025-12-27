import React from 'react';
import { useChat } from '../context/ChatContext';
import { PhoneOff } from 'lucide-react';

const VideoCall = () => {
    const { activeCall, localVideoRef, remoteVideoRef, endCall } = useChat();

    if (!activeCall) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
            <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-4 p-4">
                {/* Remote Video */}
                <div className="relative w-full md:w-2/3 h-1/2 md:h-full bg-gray-800 rounded-lg overflow-hidden">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-4 text-white font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
                        Remote User
                    </div>
                </div>

                {/* Local Video */}
                <div className="absolute top-4 right-4 w-32 h-48 md:relative md:w-1/3 md:h-1/2 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                        You
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 flex gap-4">
                <button
                    onClick={endCall}
                    className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition-transform hover:scale-110"
                >
                    <PhoneOff size={32} />
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
