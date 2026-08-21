import React from 'react';
import { Shield, Mail, Phone, User, Lock, Eye, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const PrivacyPage = () => {
    const { settings } = useSettings();
    const appName = settings?.appName || 'Aahar Jain';

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit',_sans-serif] pb-16">
            <div className="px-4 pt-6 max-w-3xl mx-auto space-y-5">
                {/* Hero Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">{appName} Privacy Policy</h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Last updated: August 2026</p>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        At <strong className="text-slate-800">{appName}</strong>, we are committed to protecting your privacy and ensuring transparency in how we handle your personal information. This Privacy Policy outlines our data collection, usage, protection practices, and your rights.
                    </p>
                </div>

                {/* Grievance & Privacy Contact Officer Card */}
                <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg border border-emerald-800/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold tracking-tight">Grievance & Privacy Officer</h3>
                            <p className="text-xs text-emerald-300 font-medium">Official Contact Details</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">Name</span>
                            <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                <User size={15} className="text-emerald-400 shrink-0" />
                                Aahar jain
                            </span>
                        </div>

                        <a 
                            href="mailto:aaharjain@gmail.com" 
                            className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 hover:bg-white/15 transition-colors block"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">Email</span>
                            <span className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                                <Mail size={15} className="text-emerald-400 shrink-0" />
                                aaharjain@gmail.com
                            </span>
                        </a>

                        <a 
                            href="tel:+919806380757" 
                            className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 hover:bg-white/15 transition-colors block"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">Phone Number</span>
                            <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                <Phone size={15} className="text-emerald-400 shrink-0" />
                                +91 9806380757
                            </span>
                        </a>
                    </div>
                </div>

                {/* Policy Clauses */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">1</span>
                            Information We Collect
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-2">
                            We collect personal information that you provide when registering, updating your profile, placing orders, or communicating with us. This includes:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 pl-2">
                            <li><strong className="text-slate-700">Account Details:</strong> Name, mobile phone number, email address.</li>
                            <li><strong className="text-slate-700">Delivery Information:</strong> Delivery address, GPS coordinates, saved landmarks.</li>
                            <li><strong className="text-slate-700">Transactional Data:</strong> Order history, payment status, transaction identifiers.</li>
                        </ul>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">2</span>
                            How We Use Your Information
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            We use your data to process and fulfill your orders, provide real-time delivery updates, communicate customer service support, maintain account security, and enhance our service offerings.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">3</span>
                            Data Security & Retention
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            We adopt strict security standards and encrypted transmission to protect your personal information against unauthorized access, loss, or misuse.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">4</span>
                            Account Deletion & Data Rights
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-3">
                            You have full rights over your data. You can delete your account and associated personal data at any time through your Profile page using the <strong>Delete Account</strong> option or by contacting our support team at <a href="mailto:aaharjain@gmail.com" className="text-primary font-bold hover:underline">aaharjain@gmail.com</a>.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                            <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-600 leading-relaxed">
                                <span className="font-bold text-slate-800">Instant Self-Service Account Deletion:</span> Navigate to <em>Profile &gt; Delete Account</em> to permanently remove your user profile, active carts, and saved lists.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600">
                    <span>Have questions about our privacy policies?</span>
                    <Link to="/support" className="inline-flex items-center gap-1.5 font-bold text-primary hover:text-emerald-700">
                        Visit Support Page <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;

