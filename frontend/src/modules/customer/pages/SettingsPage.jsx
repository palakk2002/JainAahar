import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, User, Globe, ChevronRight, ToggleRight, ToggleLeft, LogOut, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { useToast } from '@shared/components/ui/Toast';
import { customerApi } from '../services/customerApi';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, logout, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [whatsappEnabled, setWhatsappEnabled] = useState(
        user?.whatsappNotificationsEnabled !== false
    );

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const res = await customerApi.getWhatsAppPreferences();
                const data = res.data?.result || res.data;
                if (data && typeof data.whatsappNotificationsEnabled === 'boolean') {
                    setWhatsappEnabled(data.whatsappNotificationsEnabled);
                }
            } catch (e) {
                // Fallback to user auth object
                if (user?.whatsappNotificationsEnabled !== undefined) {
                    setWhatsappEnabled(user.whatsappNotificationsEnabled !== false);
                }
            }
        };
        loadPreferences();
    }, [user]);

    const handleToggleWhatsApp = async () => {
        const nextState = !whatsappEnabled;
        setWhatsappEnabled(nextState);
        try {
            await customerApi.updateWhatsAppPreferences({
                whatsappNotificationsEnabled: nextState,
            });
            if (refreshUser) await refreshUser();
            showToast(
                nextState
                    ? 'WhatsApp notifications enabled for orders & delivery'
                    : 'WhatsApp notifications muted',
                'success'
            );
        } catch (err) {
            setWhatsappEnabled(!nextState); // Rollback
            showToast('Failed to update notification preference', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-[#149d29] px-5 pt-8 pb-20 relative z-10 rounded-b-[2.5rem] shadow-lg overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
                
                <div className="flex items-center gap-3 relative z-10 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
                </div>
                <p className="text-emerald-100 text-xs font-semibold relative z-10 ml-12 -mt-3">
                    Configure your communication & account preferences
                </p>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-20 space-y-5">
                {/* Communication & WhatsApp Section */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-100">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Communication</h3>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Instant Updates
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        <div
                            onClick={handleToggleWhatsApp}
                            className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">WhatsApp Notifications</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Order confirmations, courier tracking & delivery alerts</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {whatsappEnabled ? (
                                    <ToggleRight size={32} className="text-emerald-600 fill-current" />
                                ) : (
                                    <ToggleLeft size={32} className="text-slate-300 fill-current" />
                                )}
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/profile/edit')}
                            className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">WhatsApp Phone Number</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {user?.whatsappPhone || user?.phone ? `+91 ${user?.whatsappPhone || user?.phone}` : 'Configure number in profile'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                        </div>
                    </div>
                </div>

                {/* General Section */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-100">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">General</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        <div
                            onClick={() => navigate('/profile/edit')}
                            className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">Edit Profile Information</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                        </div>
                        <div
                            onClick={() => navigate('/notifications')}
                            className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                    <Bell size={20} />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">In-App Notifications</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-100 p-3">
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full py-3.5 text-slate-700 font-bold bg-slate-50 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-sm"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
