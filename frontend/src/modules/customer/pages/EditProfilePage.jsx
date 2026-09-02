import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Camera, Save, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@core/context/AuthContext';
import { customerApi } from '../services/customerApi';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const { user, login, updateUser, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
    const fileInputRef = useRef(null);

    const [sameAsPhone, setSameAsPhone] = useState(
        !user?.whatsappPhone || user?.whatsappPhone === user?.phone
    );
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        whatsappPhone: user?.whatsappPhone || user?.phone || '',
        whatsappNotificationsEnabled: user?.whatsappNotificationsEnabled !== false,
        email: user?.email || '',
        bio: user?.bio || '',
        avatar: user?.avatar || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                whatsappPhone: user.whatsappPhone || user.phone || '',
                whatsappNotificationsEnabled: user.whatsappNotificationsEnabled !== false,
                email: user.email || '',
                bio: user.bio || '',
                avatar: user.avatar || ''
            });
            setAvatarPreview(user.avatar || '');
            setSameAsPhone(!user.whatsappPhone || user.whatsappPhone === user.phone);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file (JPEG, PNG, WebP).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size should be less than 10MB.');
            return;
        }

        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);

        // Upload to backend media API
        setIsUploadingPhoto(true);
        try {
            const uploadForm = new FormData();
            uploadForm.append('file', file);

            const uploadRes = await customerApi.uploadAvatar(uploadForm);
            const uploadedUrl =
                uploadRes.data?.data?.url ||
                uploadRes.data?.data?.secureUrl ||
                uploadRes.data?.url ||
                uploadRes.data?.secureUrl ||
                uploadRes.data?.result?.url;

            if (uploadedUrl) {
                setFormData((prev) => ({ ...prev, avatar: uploadedUrl }));
                setAvatarPreview(uploadedUrl);
                toast.success('Photo uploaded successfully! Click Save Changes to save.');
            } else {
                throw new Error('Image URL was not returned by server');
            }
        } catch (error) {
            console.error('Failed to upload photo:', error);
            toast.error(error.response?.data?.message || 'Failed to upload photo. Please try again.');
            // Revert preview to previous state
            setAvatarPreview(formData.avatar || user?.avatar || '');
        } finally {
            setIsUploadingPhoto(false);
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const handleRemovePhoto = () => {
        setAvatarPreview('');
        setFormData((prev) => ({ ...prev, avatar: '' }));
        toast.info('Photo removed. Click Save Changes to apply.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await customerApi.updateProfile(formData);
            const updatedUser = response.data?.result || response.data?.data || response.data;

            // Update local auth state immediately
            if (updateUser) {
                updateUser(updatedUser);
            }
            if (refreshUser) {
                await refreshUser();
            }

            toast.success('Profile updated successfully!');
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans pb-10">
            {/* Header */}
            <div className="bg-white sticky top-0 z-30 px-4 py-3 flex items-center gap-3 shadow-sm">
                <Link to="/profile" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </Link>
                <h1 className="text-lg font-black text-slate-800">Edit Profile</h1>
            </div>

            <div className="max-w-xl mx-auto p-5">

                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="h-28 w-28 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt={formData.name || 'Profile'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={48} className="text-slate-400" />
                            )}
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 text-white backdrop-blur-[2px]">
                                    <Loader2 size={24} className="animate-spin text-white" />
                                    <span className="text-[10px] font-bold">Uploading...</span>
                                </div>
                            )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />

                        {/* Camera Button Badge */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                            title="Upload Profile Photo"
                            className="absolute bottom-0 right-0 p-2.5 bg-primary text-primary-foreground rounded-full border-2 border-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                        >
                            {isUploadingPhoto ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Camera size={18} />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                            className="text-sm font-bold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
                        >
                            <Camera size={15} />
                            {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {avatarPreview && (
                            <>
                                <span className="text-slate-300">•</span>
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    disabled={isUploadingPhoto}
                                    className="text-sm font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    <Trash2 size={14} />
                                    Remove
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                                <div className="w-9 h-9 rounded-full bg-amber-50/80 border border-amber-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm">👤</span>
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    maxLength={50}
                                    pattern="[a-zA-Z\s]*"
                                    value={formData.name}
                                    onChange={(e) => {
                                        e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                        handleChange(e);
                                    }}
                                    className="bg-transparent w-full text-slate-800 font-bold outline-none placeholder:font-medium text-sm"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                                <div className="w-9 h-9 rounded-full bg-emerald-50/80 border border-emerald-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm">📞</span>
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="bg-transparent w-full text-slate-800 font-bold outline-none placeholder:font-medium text-sm"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                                <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700 font-black text-xs">
                                    WA
                                </div>
                                <input
                                    type="tel"
                                    name="whatsappPhone"
                                    value={formData.whatsappPhone}
                                    onChange={handleChange}
                                    className="bg-transparent w-full text-slate-800 font-bold outline-none placeholder:font-medium text-sm"
                                    placeholder="Enter WhatsApp number"
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2 px-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={sameAsPhone}
                                        onChange={(e) => {
                                            setSameAsPhone(e.target.checked);
                                            if (e.target.checked) {
                                                setFormData((prev) => ({ ...prev, whatsappPhone: prev.phone }));
                                            }
                                        }}
                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Same as primary phone number
                                </label>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">WhatsApp Notifications</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Receive order confirmations, tracking and delivery updates on WhatsApp.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="whatsappNotificationsEnabled"
                                        checked={formData.whatsappNotificationsEnabled}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNotificationsEnabled: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                                <div className="w-9 h-9 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
                                    <span className="text-sm">✉️</span>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="bg-transparent w-full text-slate-800 font-bold outline-none placeholder:font-medium text-sm"
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bio</label>
                            <div className="flex gap-3 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                                <div className="w-9 h-9 rounded-full bg-purple-50/80 border border-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-sm">📝</span>
                                </div>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-transparent outline-none text-slate-800 font-medium text-sm resize-none"
                                    placeholder="Tell us about yourself..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-brand-200 hover:bg-[#0a701a] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default EditProfilePage;

