import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SupportLogin from './pages/SupportLogin';
import SupportDashboard from './pages/SupportDashboard';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-white p-10">Loading...</div>;

    return user ? (
        <ChatProvider>
            {children}
        </ChatProvider>
    ) : <Navigate to="/login" />;
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/supportLogin" element={<SupportLogin />} />
                    <Route path="/support" element={<SupportDashboard />} />
                    <Route path="/" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
