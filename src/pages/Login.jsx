import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquareCode, ShieldCheck, Zap } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError(null);
        const success = await login(credentialResponse.credential);
        setIsLoading(false);
        if (success) {
            navigate('/');
        } else {
            setError("Authentication failed. Please verify your credentials and try again.");
        }
    };

    const handleError = () => {
        setError("Google authentication was unsuccessful. Please check your account.");
    };

    return (
        <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden p-6">
            {/* Background glowing gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-indigo-600/25 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>

            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>

            {/* Login Card */}
            <div className="relative w-full max-w-md glass-panel-heavy p-8 md:p-10 rounded-2xl shadow-2xl flex flex-col items-center z-10 transition-all duration-300 hover:border-indigo-500/20">
                {/* Brand Logo */}
                <div className="relative mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-500/30 rounded-2xl blur-md"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/20">
                        <MessageSquareCode className="w-9 h-9 text-white" />
                    </div>
                </div>

                {/* Typography */}
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-2">
                    AIKYAM Connect
                </h1>
                <p className="text-sm text-slate-400 mb-8 max-w-[280px] text-center">
                    Secure real-time group conversations and high-fidelity video meetings.
                </p>

                {/* Features List */}
                <div className="w-full space-y-4 mb-8 text-left">
                    <div className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-white/5">
                        <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
                        <span className="text-xs text-slate-300">Instant real-time messaging with WebSockets</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-white/5">
                        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                        <span className="text-xs text-slate-300">Google OAuth Single Sign-on integration</span>
                    </div>
                </div>

                {/* Login Button Area */}
                <div className="relative w-full flex flex-col items-center">
                    {isLoading ? (
                        <div className="flex items-center gap-3 text-slate-300 py-3">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Authenticating profile...</span>
                        </div>
                    ) : (
                        <div className="transform transition-transform hover:scale-[1.02] active:scale-[0.98]">
                            <GoogleLogin
                                onSuccess={handleSuccess}
                                onError={handleError}
                                theme="filled_blue"
                                size="large"
                                shape="circle"
                                text="signin_with"
                                width="320"
                            />
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mt-6 w-full p-3.5 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs text-center font-medium animate-shake">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
