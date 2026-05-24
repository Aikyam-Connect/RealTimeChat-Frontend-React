import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getSupportAnalytics, 
    getSupportUsers, 
    banUserAdmin, 
    unbanUserAdmin,
    getSupportRooms,
    getSupportRoomMessages,
    deleteMessageAdmin,
    downloadBackupZip,
    performMaintenanceCleanup,
    getMe
} from '../services/api';
import { 
    Users, 
    Activity, 
    HardDrive, 
    Download, 
    Trash2, 
    ShieldAlert, 
    LogOut, 
    ArrowLeft, 
    MessageSquare,
    Check,
    Hash,
    Settings,
    FileText,
    TrendingUp,
    ShieldOff,
    Search
} from 'lucide-react';

const SupportDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');
    const [analytics, setAnalytics] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [roomsList, setRoomsList] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [messagesList, setMessagesList] = useState([]);
    
    // UI Loading & Actions
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [roomSearch, setRoomSearch] = useState("");
    const [cleanupDays, setCleanupDays] = useState(30);
    const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(null);

    useEffect(() => {
        verifyAdminAccess();
    }, []);

    const verifyAdminAccess = async () => {
        setIsLoading(true);
        try {
            // Verify access
            await getMe();
            await fetchAnalytics();
            await fetchUsers();
            await fetchRooms();
            setIsLoading(false);
        } catch (e) {
            console.error("Admin verification failed", e);
            localStorage.removeItem('token');
            navigate('/supportLogin');
        }
    };

    const fetchAnalytics = async () => {
        try {
            const data = await getSupportAnalytics();
            setAnalytics(data);
        } catch (e) { console.error("Error analytics", e); }
    };

    const fetchUsers = async () => {
        try {
            const data = await getSupportUsers();
            setUsersList(data);
        } catch (e) { console.error(e); }
    };

    const fetchRooms = async () => {
        try {
            const data = await getSupportRooms();
            setRoomsList(data);
        } catch (e) { console.error(e); }
    };

    const triggerToast = (msg) => {
        setShowSuccessToast(msg);
        setTimeout(() => setShowSuccessToast(null), 3000);
    };

    const handleBanUser = async (userId, isBanned) => {
        setIsActionLoading(true);
        try {
            if (isBanned) {
                await unbanUserAdmin(userId);
                triggerToast("User unbanned successfully");
            } else {
                await banUserAdmin(userId);
                triggerToast("User suspended. Active sockets terminated.");
            }
            await fetchUsers();
            await fetchAnalytics();
        } catch (e) { console.error(e); }
        setIsActionLoading(false);
    };

    const handleSelectRoom = async (roomId) => {
        setSelectedRoomId(roomId);
        try {
            const data = await getSupportRoomMessages(roomId);
            setMessagesList(data);
        } catch (e) { console.error(e); }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm("Are you sure you want to delete this message? If it has Cloudinary attachments they will be destroyed.")) return;
        setIsActionLoading(true);
        try {
            await deleteMessageAdmin(messageId);
            triggerToast("Message and media removed");
            if (selectedRoomId) {
                await handleSelectRoom(selectedRoomId);
            }
            await fetchAnalytics();
        } catch (e) { console.error(e); }
        setIsActionLoading(false);
    };

    const handleDownloadBackup = async () => {
        setIsActionLoading(true);
        try {
            const blob = await downloadBackupZip();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `aikyam_connect_backup_${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            triggerToast("Database tables exported successfully as ZIP");
        } catch (e) { console.error(e); }
        setIsActionLoading(false);
    };

    const handleCleanup = async () => {
        setIsActionLoading(true);
        try {
            const data = await performMaintenanceCleanup(cleanupDays);
            triggerToast(`Cleanup finished. Deleted ${data.deleted_messages_count} messages.`);
            setShowCleanupConfirm(false);
            await fetchAnalytics();
            if (selectedRoomId) {
                await handleSelectRoom(selectedRoomId);
            }
        } catch (e) { console.error(e); }
        setIsActionLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/supportLogin');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold tracking-wider text-rose-500 uppercase animate-pulse">Authenticating Admin Credentials...</span>
            </div>
        );
    }

    const filteredUsers = usersList.filter(u => 
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || 
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
    );

    const filteredRooms = roomsList.filter(r => 
        (r.name || "").toLowerCase().includes(roomSearch.toLowerCase())
    );

    return (
        <div className="h-screen h-[100dvh] bg-slate-950 text-slate-100 flex overflow-hidden font-sans relative">
            {/* Ambient Background glows */}
            <div className="absolute top-10 left-10 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Side Navigation Menu */}
            <div className="w-16 md:w-64 bg-slate-900/40 border-r border-slate-900/80 flex flex-col justify-between z-10 shrink-0">
                <div>
                    {/* Brand Banner */}
                    <div className="p-4 md:p-6 border-b border-slate-900/60 flex items-center justify-center md:justify-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-tr from-rose-600 to-indigo-650 rounded-xl flex items-center justify-center border border-rose-500/20 text-white font-bold shrink-0">
                            A
                        </div>
                        <div className="flex flex-col hidden md:flex min-w-0">
                            <span className="font-bold text-sm tracking-tight text-white truncate">AIKYAM Connect</span>
                            <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase truncate">Admin Console</span>
                        </div>
                    </div>

                    {/* Nav options */}
                    <nav className="p-2 md:p-4 space-y-1.5">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`w-full flex items-center justify-center md:justify-start gap-3 py-3 px-3 md:px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                                activeTab === 'analytics' 
                                    ? 'bg-rose-600/10 text-rose-400 border border-rose-500/10' 
                                    : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                            }`}
                            title="System Analytics"
                        >
                            <Activity size={16} className="shrink-0" />
                            <span className="hidden md:inline">System Analytics</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('moderation')}
                            className={`w-full flex items-center justify-center md:justify-start gap-3 py-3 px-3 md:px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                                activeTab === 'moderation' 
                                    ? 'bg-rose-600/10 text-rose-400 border border-rose-500/10' 
                                    : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                            }`}
                            title="User Moderation"
                        >
                            <ShieldAlert size={16} className="shrink-0" />
                            <span className="hidden md:inline">User Moderation</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`w-full flex items-center justify-center md:justify-start gap-3 py-3 px-3 md:px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                                activeTab === 'chats' 
                                    ? 'bg-rose-600/10 text-rose-400 border border-rose-500/10' 
                                    : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Chat History"
                        >
                            <MessageSquare size={16} className="shrink-0" />
                            <span className="hidden md:inline">Chat History</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('maintenance')}
                            className={`w-full flex items-center justify-center md:justify-start gap-3 py-3 px-3 md:px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                                activeTab === 'maintenance' 
                                    ? 'bg-rose-600/10 text-rose-400 border border-rose-500/10' 
                                    : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Maintenance & Backup"
                        >
                            <Settings size={16} className="shrink-0" />
                            <span className="hidden md:inline">Maintenance & Backup</span>
                        </button>
                    </nav>
                </div>

                {/* Footer Controls */}
                <div className="p-2 md:p-4 border-t border-slate-900/60 space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-2.5 px-2 md:px-3 bg-slate-900/40 hover:bg-slate-900 text-xs font-bold rounded-xl border border-slate-800 text-slate-400 hover:text-slate-250 flex items-center justify-center gap-2 transition-all"
                        title="Back to Chat App"
                    >
                        <ArrowLeft size={14} className="shrink-0" />
                        <span className="hidden md:inline">Back to Chat App</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-2 md:px-3 bg-rose-650/10 hover:bg-rose-600 text-xs font-bold rounded-xl border border-rose-500/10 text-rose-450 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        title="Sign Out Admin"
                    >
                        <LogOut size={14} className="shrink-0" />
                        <span className="hidden md:inline">Sign Out Admin</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full z-10 overflow-hidden p-6 md:p-8 bg-slate-950/20">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 shrink-0">
                    <h2 className="text-xl font-black text-white capitalize tracking-tight">{activeTab} Controls</h2>
                    {isActionLoading && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 px-3.5 py-1.5 bg-rose-500/5 rounded-xl border border-rose-500/10">
                            <div className="w-3.5 h-3.5 border border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Executing Action...</span>
                        </div>
                    )}
                </header>

                {/* Tab content selection */}
                {activeTab === 'analytics' && analytics && (
                    <div className="space-y-6 flex-1 overflow-y-auto pr-1 animate-in fade-in duration-300">
                        {/* Summary Grid Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="glass-panel p-5 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Total Profiles</span>
                                <span className="text-3xl font-extrabold text-white">{analytics.total_users}</span>
                            </div>
                            <div className="glass-panel p-5 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Online Sessions</span>
                                <span className="text-3xl font-extrabold text-emerald-400 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                                    {analytics.online_users}
                                </span>
                            </div>
                            <div className="glass-panel p-5 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Messages Today</span>
                                <span className="text-3xl font-extrabold text-indigo-400">{analytics.messages_today}</span>
                            </div>
                            <div className="glass-panel p-5 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Chat Channels</span>
                                <span className="text-3xl font-extrabold text-white">{analytics.active_rooms}</span>
                            </div>
                            <div className="glass-panel p-5 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Media Storage</span>
                                <span className="text-3xl font-extrabold text-white truncate">{analytics.storage_usage}</span>
                            </div>
                        </div>

                        {/* Visual Chart Mockup using pure flexible HTML elements */}
                        <div className="glass-panel p-6 rounded-2xl flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp size={16} className="text-rose-500" />
                                    Growth Vectors (Registrations By Month)
                                </h3>
                            </div>
                            <div className="h-64 flex items-end gap-6 border-b border-slate-900 pb-2 pt-6">
                                {analytics.growth.map((g, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {g.count}
                                        </div>
                                        {/* CSS dynamic height bar graph */}
                                        <div 
                                            className="w-full bg-gradient-to-t from-rose-600 to-indigo-650 rounded-t-lg transition-all duration-500 ease-out hover:brightness-110 shadow-lg"
                                            style={{ height: `${Math.max((g.count / analytics.total_users) * 160, 20)}px` }}
                                        ></div>
                                        <div className="text-[10px] text-slate-500 font-semibold uppercase whitespace-nowrap mt-2">
                                            {g.month}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'moderation' && (
                    <div className="space-y-6 flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
                        {/* Search controls */}
                        <div className="relative flex items-center bg-slate-900/40 border border-slate-900 rounded-xl px-4 py-3 text-slate-400 focus-within:border-rose-500/40 max-w-md w-full transition-all duration-200">
                            <Search size={16} className="text-slate-500 mr-2" />
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Search administrators or users..."
                                className="bg-transparent text-xs w-full focus:outline-none text-slate-200"
                            />
                        </div>

                        {/* Users Table */}
                        <div className="flex-1 overflow-auto border border-slate-900 rounded-2xl bg-slate-900/10">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-900 text-slate-500 uppercase font-bold tracking-wider">
                                        <th className="p-4">Profile</th>
                                        <th className="p-4">Email Address</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900/60">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                                            <td className="p-4 flex items-center gap-3">
                                                <img src={u.picture || 'https://via.placeholder.com/150'} alt={u.name} className="w-8 h-8 rounded-full border border-slate-800" />
                                                <span className="font-semibold text-slate-200">{u.name}</span>
                                            </td>
                                            <td className="p-4 text-slate-400 font-medium">{u.email}</td>
                                            <td className="p-4">
                                                {u.is_banned ? (
                                                    <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 font-bold text-[9px] uppercase tracking-wider">Banned</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 font-bold text-[9px] uppercase tracking-wider">Active</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleBanUser(u.id, u.is_banned)}
                                                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 ${
                                                        u.is_banned 
                                                            ? 'bg-emerald-600/10 border border-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white' 
                                                            : 'bg-rose-600/10 border border-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white'
                                                    }`}
                                                >
                                                    {u.is_banned ? 'Unban User' : 'Suspend Profile'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'chats' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 overflow-hidden animate-in fade-in duration-300">
                        {/* Rooms List Panel */}
                        <div className="w-full md:w-80 h-[220px] md:h-full glass-panel p-4 rounded-2xl flex flex-col gap-3 min-h-0 shrink-0">
                            <div className="relative flex items-center bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400 focus-within:border-rose-500/40 transition-all duration-200">
                                <Search size={14} className="text-slate-500 mr-2" />
                                <input
                                    type="text"
                                    value={roomSearch}
                                    onChange={(e) => setRoomSearch(e.target.value)}
                                    placeholder="Filter rooms..."
                                    className="bg-transparent text-xs w-full focus:outline-none text-slate-200"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {filteredRooms.map(room => (
                                    <div
                                        key={room.id}
                                        onClick={() => handleSelectRoom(room.id)}
                                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between border border-transparent transition-all ${
                                            selectedRoomId === room.id 
                                                ? 'bg-rose-600/10 border-rose-500/25 text-white' 
                                                : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-500 shrink-0">
                                                {room.is_group ? <Hash size={14} /> : <Users size={14} />}
                                            </div>
                                            <span className="text-xs font-semibold truncate">{room.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Room Messages Inspector Panel */}
                        <div className="flex-1 glass-panel p-4 rounded-2xl flex flex-col min-h-0 overflow-hidden">
                            {selectedRoomId ? (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="pb-3 border-b border-slate-900 mb-4 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Messages Logs ({messagesList.length})
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                                        {messagesList.map(msg => (
                                            <div key={msg.id} className="p-3 bg-slate-900/40 border border-slate-900/80 rounded-2xl flex justify-between gap-4 items-start hover:border-slate-800 transition-colors">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-xs font-bold text-white">{msg.sender_name}</span>
                                                        <span className="text-[9px] text-slate-500">#{msg.sender_id}</span>
                                                        <span className="text-[9px] text-slate-500">•</span>
                                                        <span className="text-[9px] text-slate-500">{new Date(msg.created_at).toLocaleString()}</span>
                                                    </div>
                                                    {msg.message_type === 'text' ? (
                                                        <p className="text-xs text-slate-350 whitespace-pre-wrap break-words">{msg.content}</p>
                                                    ) : (
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <span className="text-[10px] text-indigo-400 font-semibold">Attachment: {msg.message_type}</span>
                                                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline break-all truncate block">{msg.file_url}</a>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="p-2 bg-rose-600/10 hover:bg-rose-600 hover:text-white border border-rose-500/10 text-rose-450 rounded-xl transition-all"
                                                    title="Erase message"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                                    <MessageSquare size={32} className="opacity-20 mb-2" />
                                    Select a channel/room to inspect conversation details
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'maintenance' && (
                    <div className="space-y-6 flex-1 overflow-y-auto pr-1 animate-in fade-in duration-300 max-w-xl">
                        {/* Backup settings */}
                        <div className="glass-panel p-6 rounded-3xl border border-slate-900 space-y-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} className="text-rose-500" />
                                System Database Export
                            </h3>
                            <p className="text-xs text-slate-450 leading-relaxed">
                                Aggregate all database rows (Users, Rooms, Messages, Members, Support lists) into JSON formatted data, compress it in memory, and download as a ZIP file.
                            </p>
                            <button
                                onClick={handleDownloadBackup}
                                className="flex items-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/10 transition-all"
                            >
                                <Download size={14} />
                                Download ZIP Backup
                            </button>
                        </div>

                        {/* Database Cleanup Panel */}
                        <div className="glass-panel p-6 rounded-3xl border border-slate-900 space-y-4">
                            <h3 className="text-sm font-bold text-rose-550 uppercase tracking-wider flex items-center gap-2">
                                <Trash2 size={16} className="text-rose-500" />
                                Old Message Database Purge
                            </h3>
                            <p className="text-xs text-slate-450 leading-relaxed">
                                Free up storage space. Erasing old messages will also invoke signature requests to automatically destroy matching Cloudinary attachments.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Purge threshold (days)</span>
                                    <input 
                                        type="number"
                                        value={cleanupDays}
                                        onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                                        className="w-32 bg-slate-900 border border-slate-800 text-xs py-2 px-3.5 rounded-xl text-slate-100 focus:outline-none focus:border-rose-500/40"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowCleanupConfirm(true)}
                                    className="py-3 px-5 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/15 hover:text-white text-rose-400 text-xs font-bold rounded-2xl self-end transition-all active:scale-[0.97]"
                                >
                                    Clear Old Data
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Safety Confirmation Dialog for Purges */}
            {showCleanupConfirm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full mx-4 shadow-2xl">
                        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/10 mb-5">
                            <ShieldAlert size={26} />
                        </div>
                        <h4 className="text-base font-bold text-white mb-2">Destructive Database Action</h4>
                        <p className="text-xs text-slate-450 leading-relaxed mb-6">
                            You are about to permanently delete messages older than <strong className="text-white">{cleanupDays} days</strong>. This action will also trigger API requests to remove all matching images, audio files, and PDFs from Cloudinary. This action is irreversible.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCleanupConfirm(false)}
                                className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-slate-450 text-xs font-bold rounded-xl transition-colors"
                            >
                                Cancel Purge
                            </button>
                            <button
                                onClick={handleCleanup}
                                className="flex-1 py-3 bg-rose-650 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/10"
                            >
                                Yes, Purge Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Glassmorphic success notification banner */}
            {showSuccessToast && (
                <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 shadow-2xl z-50 animate-toast-in">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Check size={14} />
                    </div>
                    <span className="text-xs font-semibold">{showSuccessToast}</span>
                </div>
            )}
        </div>
    );
};

export default SupportDashboard;
