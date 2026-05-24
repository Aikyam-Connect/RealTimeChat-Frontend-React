import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, 
    MessageSquare, 
    LogOut, 
    Search, 
    Hash, 
    MessageSquareIcon, 
    User, 
    ChevronRight,
    Users
} from 'lucide-react';

const Sidebar = ({ width }) => {
    const { 
        rooms, 
        users, 
        currentRoom, 
        selectRoom, 
        selectDirectChat, 
        createNewRoom 
    } = useChat();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'groups'
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;
        await createNewRoom(newRoomName.trim(), true); // Default to group
        setNewRoomName("");
        setIsCreating(false);
    };

    const filteredRooms = rooms.filter(room => 
        room.is_group && (room.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(u => 
        u.id !== user?.id && (u.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get active direct chats (non-group rooms we are in)
    // We can infer active direct chats by looking at non-group rooms, 
    // but a cleaner fallback is listing all users and clicking them creates/opens direct chat.
    // Let's show all users in the 'chats' tab for messaging, and all group rooms in the 'groups' tab.
    // This is super simple and standard!

    return (
        <div 
            className="bg-slate-950 border-r border-slate-900 flex flex-col h-full text-slate-100 z-10 shrink-0"
            style={{ width: width && window.innerWidth >= 768 ? `${width}px` : '100%' }}
        >
            {/* User Profile Header */}
            <div className="p-4 border-b border-slate-900/60 bg-slate-950/20 backdrop-blur flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                            src={user?.picture || 'https://via.placeholder.com/150'} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full border border-slate-700/50" 
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm truncate max-w-[120px]">{user?.name}</span>
                        <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                    </div>
                </div>
                <button 
                    onClick={logout} 
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900/50 transition-all duration-200"
                    title="Sign Out"
                >
                    <LogOut size={16} />
                </button>
            </div>

            {/* Search Box */}
            <div className="p-4 pb-2">
                <div className="relative flex items-center bg-slate-900/50 border border-slate-800/80 rounded-xl px-3 py-2 text-slate-400 focus-within:border-indigo-500/50 transition-all duration-200">
                    <Search size={16} className="text-slate-500 mr-2 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeTab === 'chats' ? "Search users..." : "Search rooms..."}
                        className="bg-transparent text-sm w-full focus:outline-none text-slate-200 placeholder-slate-500"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-2 flex border-b border-slate-900/40">
                <button
                    onClick={() => { setActiveTab('chats'); setIsCreating(false); }}
                    className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                        activeTab === 'chats' 
                            ? 'border-indigo-500 text-indigo-400 font-bold' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Chats
                </button>
                <button
                    onClick={() => { setActiveTab('groups'); }}
                    className={`flex-1 text-center py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                        activeTab === 'groups' 
                            ? 'border-indigo-500 text-indigo-400 font-bold' 
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Groups
                </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Create Room form (only for Groups tab) */}
                {activeTab === 'groups' && (
                    <div className="mb-2">
                        {isCreating ? (
                            <form onSubmit={handleCreate} className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="Enter group name..."
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 mb-2 focus:outline-none focus:border-indigo-500/50"
                                    required
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-2.5 py-1 text-[10px] font-semibold bg-slate-850 hover:bg-slate-800 rounded text-slate-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-2.5 py-1 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-700 rounded text-white transition-colors"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/10 text-xs font-semibold transition-all duration-200 active:scale-[0.98]"
                            >
                                <Plus size={14} />
                                Create New Group
                            </button>
                        )}
                    </div>
                )}

                {/* Direct Chats (Users List) */}
                {activeTab === 'chats' && (
                    <div className="space-y-1.5">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(u => {
                                const isActive = currentRoom && !currentRoom.is_group && 
                                    (currentRoom.name.includes(u.name) || currentRoom.created_by === u.id); // Simple check

                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => selectDirectChat(u.id)}
                                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                            isActive 
                                                ? 'bg-gradient-to-r from-indigo-650/40 to-indigo-600/10 border border-indigo-500/20 text-white shadow-md' 
                                                : 'hover:bg-slate-900/40 border border-transparent text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <img 
                                                    src={u.picture || 'https://via.placeholder.com/150'} 
                                                    alt={u.name} 
                                                    className="w-10 h-10 rounded-full border border-slate-800/80" 
                                                />
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-sm truncate">{u.name}</span>
                                                <span className="text-[10px] text-slate-500 truncate">{u.email}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-600 shrink-0" />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-xs text-slate-600">
                                No users found
                            </div>
                        )}
                    </div>
                )}

                {/* Groups / Chat Rooms */}
                {activeTab === 'groups' && (
                    <div className="space-y-1.5">
                        {filteredRooms.length > 0 ? (
                            filteredRooms.map(room => {
                                const isActive = currentRoom && currentRoom.id === room.id;

                                return (
                                    <div
                                        key={room.id}
                                        onClick={() => selectRoom(room)}
                                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                            isActive 
                                                ? 'bg-gradient-to-r from-indigo-650/40 to-indigo-600/10 border border-indigo-500/20 text-white shadow-md' 
                                                : 'hover:bg-slate-900/40 border border-transparent text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-slate-900 border border-slate-800/85 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                                                <Hash size={18} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-sm truncate">{room.name}</span>
                                                <span className="text-[10px] text-slate-500">Group Room</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-600 shrink-0" />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-xs text-slate-600">
                                No groups found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
