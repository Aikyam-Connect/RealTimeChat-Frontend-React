import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Phone } from 'lucide-react';

const ChatArea = () => {
    const { currentRoom, messages, sendMessage, joinRoom } = useChat();
    const [input, setInput] = useState("");
    const bottomRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
    };

    if (!currentRoom) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-500">
                Select a room to start chatting
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-950">
            {/* Header */}
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">{currentRoom.name}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender_id ? '' : 'items-center'} `}>
                        {/* We need logic to distinguish own messages, but simplify for now */}
                        <div className="bg-gray-800 p-3 rounded-lg max-w-xl">
                            <p className="text-xs text-blue-400 mb-1">{msg.sender_name}</p>
                            <p className="text-gray-200">{msg.content}</p>
                            <p className="text-[10px] text-gray-500 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-gray-900 border-t border-gray-800 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors">
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatArea;
