import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, ChevronLeft, Building, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';
import ContactDetailCard from '../components/shared/ContactDetailCard';

const ContactUsPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const appName = settings?.appName || 'Aahar Jain';

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit',_sans-serif] pb-24">
            {/* Top Navigation */}
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
                        <h1 className="text-lg font-black text-slate-900 leading-tight">Contact Us</h1>
                        <p className="text-[11px] text-slate-500 font-medium">Get in touch with the {appName} team</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 max-w-3xl mx-auto space-y-5">
                {/* Hero / Intro Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-primary shadow-2xs shrink-0">
                            <Building size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">{appName} Customer Support</h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">We're here to help you 7 days a week</p>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Have queries about your order, products, or partner inquiries? Reach out through any of our official communication channels below.
                    </p>
                </div>

                {/* Main Mandatory Contact Detail Card */}
                <ContactDetailCard title="Official Contact & Helpline" />

                {/* Additional Business Details */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
                    <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                        Business & Office Information
                    </h3>

                    <div className="space-y-4 text-sm">
                        {/* Working Hours */}
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
                                <Clock size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Operational & Support Hours</h4>
                                <p className="text-slate-600 text-xs mt-0.5">Monday to Sunday: 6:00 AM – 11:00 PM IST</p>
                                <p className="text-slate-400 text-[11px] mt-0.5">Instant live chat available during operating hours</p>
                            </div>
                        </div>

                        {/* Registered Office Address */}
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 text-sm md:text-base uppercase tracking-wide">
                                    {settings?.companyName || 'JAINA ENTERPRISES'}
                                </h4>
                                <div className="text-slate-600 text-xs md:text-sm mt-1 leading-relaxed font-medium space-y-0.5">
                                    {settings?.address ? (
                                        <div className="whitespace-pre-line">{settings.address}</div>
                                    ) : (
                                        <>
                                            <p>Flat/Door/Block No. 00, SITA CENTRAL SCHOOL,</p>
                                            <p>Karera, Road/Street/Lane KARERA,</p>
                                            <p>District SHIVPURI, MADHYA PRADESH - 473660</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts to Support & Policies */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Link
                        to="/support"
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1.5 hover:bg-slate-50 transition-colors"
                    >
                        <span className="text-2xl">💬</span>
                        <span className="font-bold text-slate-800 text-sm">Live Support</span>
                        <span className="text-[10px] text-slate-500">FAQ & Tickets</span>
                    </Link>

                    <Link
                        to="/shipping-policy"
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1.5 hover:bg-slate-50 transition-colors"
                    >
                        <span className="text-2xl">🚚</span>
                        <span className="font-bold text-slate-800 text-sm">Shipping Policy</span>
                        <span className="text-[10px] text-slate-500">Timelines & Rates</span>
                    </Link>

                    <Link
                        to="/cancellation-refund-policy"
                        className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1.5 hover:bg-slate-50 transition-colors"
                    >
                        <span className="text-2xl">🔄</span>
                        <span className="font-bold text-slate-800 text-sm">Refund Policy</span>
                        <span className="text-[10px] text-slate-500">Returns & Timelines</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ContactUsPage;
