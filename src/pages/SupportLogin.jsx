import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { loginSupport, getMe } from '../services/api';
import { ShieldCheck, ArrowLeft, Lock, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SupportLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth(); // We can use direct call or login
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await loginSupport(credentialResponse.credential);
            localStorage.setItem('token', data.access_token);
            // Verify access worked
            const userProfile = await getMe();
            setIsLoading(false);
            // Redirect to admin panel
            navigate('/support');
        } catch (e) {
            setIsLoading(false);
            const msg = e.response?.data?.detail || "Authentication declined. Your email is not authorized for support console access.";
            setError(msg);
        }
    };

    const handleError = () => {
        setError("Google credentials verification failed. Please try again.");
    };

    return (
        <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden p-6">
            {/* Background glowing gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-indigo-650/20 rounded-full blur-[90px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-rose-900/15 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '5s' }}></div>

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-30"></div>

            {/* Card wrapper */}
            <div className="relative w-full max-w-md glass-panel-heavy p-8 rounded-3xl shadow-2xl flex flex-col items-center z-10">
                
                {/* Back to Chat Option */}
                <button 
                    onClick={() => navigate('/')} 
                    className="absolute top-6 left-6 text-slate-500 hover:text-slate-350 flex items-center gap-1 text-xs font-semibold transition-colors"
                >
                    <ArrowLeft size={14} />
                    Chat App
                </button>

                {/* Lock Shield Header Badge */}
                <div className="relative mt-8 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-rose-500/20 rounded-2xl blur-md"></div>
                    <div className="relative w-14 h-14 bg-gradient-to-tr from-rose-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-rose-400/25 text-white">
                        <ShieldCheck size={28} />
                    </div>
                </div>

                <span className="text-[9px] text-rose-450 font-extrabold tracking-widest uppercase mb-1">Secure Support Terminal</span>
                <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2">
                    Console Credentials
                </h1>
                <p className="text-xs text-slate-450 mb-8 max-w-[280px] text-center">
                    Authorization is limited to verified administrator accounts in `support_access`.
                </p>

                {/* Alert info banner */}
                <div className="w-full p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl flex gap-3 text-slate-450 text-[11px] leading-relaxed text-left mb-8">
                    <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>This page does not support guest registrations. Unauthorized login attempts are logged and blocked automatically.</span>
                </div>

                {/* Action Google Trigger */}
                <div className="w-full flex flex-col items-center justify-center min-h-[48px]">
                    {isLoading ? (
                        <div className="flex items-center gap-3 text-slate-300">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-bold">Verifying admin rights...</span>
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
                                width="300"
                            />
                        </div>
                    )}
                </div>

                {/* Error Box */}
                {error && (
                    <div className="mt-6 w-full p-3.5 bg-rose-950/40 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] text-center font-medium animate-shake">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportLogin;
