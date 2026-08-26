import React from 'react';
import { ChevronLeft, Truck, Heart, ShoppingBag, Award, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';
import ContactDetailCard from '../components/shared/ContactDetailCard';

const AboutPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const appName = settings?.appName || 'Aahar Jain';

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit',_sans-serif] pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors -ml-1 text-slate-800 cursor-pointer"
                        aria-label="Back"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 leading-tight">About Us</h1>
                        <p className="text-[11px] text-slate-500 font-medium">Learn more about {appName}</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 max-w-3xl mx-auto space-y-5">
                {/* Hero Section */}
                <div className="rounded-3xl p-6 text-center bg-white border border-slate-100 shadow-sm">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shadow-xs mb-3 text-primary">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-2xl font-extrabold mb-1 tracking-tight text-slate-900">{appName}</h2>
                        <p className="text-slate-600 text-sm font-medium max-w-sm mx-auto">
                            Delivering fresh groceries, purity, and everyday essentials directly to your doorstep.
                        </p>
                    </div>
                </div>

                {/* Mandatory Contact Detail Card */}
                <ContactDetailCard title="Connect With Our Leadership" />

                {/* Mission Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3.5 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shadow-2xs shrink-0">
                            <Truck size={20} />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">Our Mission</h3>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm">
                        To revolutionize quick commerce and daily grocery shopping by providing the fastest, most reliable delivery of fresh, 100% vegetarian & organic daily essentials, ensuring unmatched quality and trust for every household.
                    </p>
                </div>

                {/* Values Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shadow-2xs shrink-0">
                            <Heart size={20} />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">Our Core Values</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 mb-1">🌱 100% Pure & Fresh</h4>
                            <p className="text-xs text-slate-600">Handpicked farm-fresh produce and genuine quality essentials.</p>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 mb-1">⚡ Superfast Delivery</h4>
                            <p className="text-xs text-slate-600">Swift order fulfillment directly from our nearest hub to your home.</p>
                        </div>
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 mb-1">🤝 Customer First</h4>
                            <p className="text-xs text-slate-600">Dedicated support, instant resolution, and complete transparency.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-2">
                    <p className="text-xs font-semibold text-slate-400">© {new Date().getFullYear()} {appName}. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;

