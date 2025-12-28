import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import VideoCall from '../components/VideoCall';
import { useChat } from '../context/ChatContext';
import { PhoneIncoming } from 'lucide-react';

const Dashboard = () => {
    const { incomingCall, acceptCall } = useChat();

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            <Sidebar />
            <ChatArea />
            <VideoCall />

            {/* Incoming Call Modal */}
            {incomingCall && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl flex flex-col items-center">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <PhoneIncoming size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{incomingCall.callerName} is calling...</h3>
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={acceptCall}
                                className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-full font-bold transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-full font-bold transition-colors"
                                onClick={() => window.location.reload()} // Quick hack to reject for now
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
