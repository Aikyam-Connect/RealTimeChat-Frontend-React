import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL; // Adjust if needed

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginGoogle = async (credential) => {
    const response = await api.post('/login/google', { credential });
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

export const getMyRooms = async () => {
    const response = await api.get('/api/rooms');
    return response.data;
}

export const getMessages = async (roomId) => {
    const response = await api.get(`/api/rooms/${roomId}/messages`);
    return response.data;
}

export const createRoom = async (name, isGroup) => {
    const response = await api.post('/api/rooms', { name, is_group: isGroup });
    return response.data;
}

export const joinRoom = async (roomId, userId) => {
    const response = await api.post(`/api/rooms/${roomId}/join?user_id_to_add=${userId}`);
    return response.data;
}

export const getOrCreateDirectRoom = async (targetUserId) => {
    const response = await api.post(`/api/rooms/direct?target_user_id=${targetUserId}`);
    return response.data;
}

export const getRoomMembers = async (roomId) => {
    const response = await api.get(`/api/rooms/${roomId}/members`);
    return response.data;
}

export const getAllUsers = async () => {
    const response = await api.get('/api/users');
    return response.data;
}

export const getWSUrl = (token) => {
    // Derive WS URL from API_URL to support network access and handle trailing slash
    const cleanUrl = API_URL.replace(/\/$/, '');
    const baseUrl = cleanUrl.replace('http', 'ws');
    return `${baseUrl}/ws?token=${token}`;
}

// Custom Upload with Progress
export const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.post("/api/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 105) / progressEvent.total); // slight pad
                onProgress(percentCompleted > 100 ? 100 : percentCompleted);
            }
        }
    });
    return response.data;
};

// Support Auth
export const loginSupport = async (credential) => {
    const response = await api.post('/api/support/login', { credential });
    return response.data;
};

// Support Analytics & Controls
export const getSupportAnalytics = async () => {
    const response = await api.get('/api/support/analytics');
    return response.data;
};

export const getSupportUsers = async () => {
    const response = await api.get('/api/support/users');
    return response.data;
};

export const banUserAdmin = async (userId) => {
    const response = await api.post(`/api/support/users/${userId}/ban`);
    return response.data;
};

export const unbanUserAdmin = async (userId) => {
    const response = await api.post(`/api/support/users/${userId}/unban`);
    return response.data;
};

export const getSupportRooms = async () => {
    const response = await api.get('/api/support/rooms');
    return response.data;
};

export const getSupportRoomMessages = async (roomId) => {
    const response = await api.get(`/api/support/rooms/${roomId}/messages`);
    return response.data;
};

export const deleteMessageAdmin = async (messageId) => {
    const response = await api.delete(`/api/support/messages/${messageId}`);
    return response.data;
};

export const downloadBackupZip = async () => {
    const response = await api.post('/api/support/maintenance/backup', {}, {
        responseType: 'blob'
    });
    return response.data;
};

export const performMaintenanceCleanup = async (olderThanDays) => {
    const response = await api.post(`/api/support/maintenance/cleanup?older_than_days=${olderThanDays}`);
    return response.data;
};

export default api;
