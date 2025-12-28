import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, MessageSquare, LogOut, Video } from 'lucide-react';

const Sidebar = () => {
    const { rooms, users, selectRoom, createNewRoom, callUser } = useChat();
    const { user, logout } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");

    const handleCreate = async () => {
        if (!newRoomName) return;
        await createNewRoom(newRoomName, true); // defaulting to group for now
        setNewRoomName("");
        setIsCreating(false);
    };

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full text-gray-100">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={user?.picture} alt="Profile" className="w-8 h-8 rounded-full" />
                    <span className="font-semibold truncate w-24">{user?.name}</span>
                </div>
                <button onClick={logout} className="text-gray-400 hover:text-red-400">
                    <LogOut size={18} />
                </button>
            </div>

            {/* Rooms Section */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Rooms</h3>
                    <button onClick={() => setIsCreating(!isCreating)} className="text-blue-500 hover:text-blue-400">
                        <Plus size={18} />
                    </button>
                </div>

                {isCreating && (
                    <div className="mb-4">
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Room name"
                            className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-sm mb-2"
                        />
                        <button
                            onClick={handleCreate}
                            className="w-full bg-blue-600 text-sm py-1 rounded hover:bg-blue-700"
                        >
                            Create
                        </button>
                    </div>
                )}

                <div className="space-y-2">
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            onClick={() => selectRoom(room)}
                            className="p-2 hover:bg-gray-800 rounded cursor-pointer flex items-center gap-2"
                        >
                            <MessageSquare size={16} className="text-gray-500" />
                            <span>{room.name}</span>
                        </div>
                    ))}
                </div>

                {/* Users Section (for Logic of calling/adding) */}
                <h3 className="text-sm font-bold text-gray-400 uppercase mt-8 mb-4">Users</h3>
                <div className="space-y-2">
                    {users.filter(u => u.id !== user?.id).map(u => (
                        <div key={u.id} className="flex justify-between items-center p-2 hover:bg-gray-800 rounded group">
                            <span className="truncate">{u.name}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                <button onClick={() => callUser(u.id)} className="text-green-500 hover:text-green-400">
                                    <Video size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
