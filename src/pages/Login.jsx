import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleSuccess = async (credentialResponse) => {
        const success = await login(credentialResponse.credential);
        if (success) {
            navigate('/');
        } else {
            setError("Login failed. Please try again.");
        }
    };

    const handleError = () => {
        setError("Google Login Failed");
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                <h1 className="text-3xl font-bold mb-8 text-blue-500">RealTime Chat</h1>
                <p className="text-gray-400 mb-8">Sign in with Google to continue</p>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        theme="filled_black"
                        size="large"
                        shape="pill"
                    />
                </div>

                {error && (
                    <div className="mt-4 p-2 bg-red-500 bg-opacity-20 text-red-500 rounded text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
