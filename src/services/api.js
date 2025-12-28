import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; // Adjust if needed

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

export const getAllUsers = async () => {
    const response = await api.get('/api/users');
    return response.data;
}

export const getWSUrl = (token) => {
    return `ws://127.0.0.1:8000/ws?token=${token}`;
}

export default api;
