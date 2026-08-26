import React from 'react';
import { RotateCcw, Clock, CheckCircle2, AlertTriangle, ChevronLeft, CreditCard, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';
import ContactDetailCard from '../components/shared/ContactDetailCard';

const RefundPolicyPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const appName = settings?.appName || 'Aahar Jain';

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit',_sans-serif] pb-20">
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
                        <h1 className="text-lg font-black text-slate-900 leading-tight">Cancellation & Refund Policy</h1>
                        <p className="text-[11px] text-slate-500 font-medium">Cancellation rules, returns, and refund timelines</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 max-w-3xl mx-auto space-y-5">
                {/* Hero Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-primary shadow-2xs shrink-0">
                            <RotateCcw size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">{appName} Cancellation & Refunds</h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Last updated: August 2026</p>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        We prioritize customer delight and quality guarantee. If you are unsatisfied with any item received or need to cancel an order, this policy explains the process, conditions, and timelines.
                    </p>
                </div>

                {/* Contact Card */}
                <ContactDetailCard title="Refund & Grievance Support" />

                {/* Policy Clauses Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                    {/* Clause 1: Order Cancellation */}
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            1
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-base font-extrabold text-slate-900">Order Cancellation by Customer</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                You may cancel your order at any time before it is packed or dispatched by our fulfillment store:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 pl-1">
                                <li><strong className="text-slate-800">Before Dispatch:</strong> Instant 100% full refund to original payment source or wallet.</li>
                                <li><strong className="text-slate-800">After Dispatch / Out for Delivery:</strong> Cancellation may incur delivery logistics charges or may not be eligible for cancellation for perishable groceries.</li>
                            </ul>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Clause 2: Returns & Replacements */}
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            2
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-base font-extrabold text-slate-900">Returns & Quality Issues</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Please inspect your order upon delivery. If any product is damaged, spoiled, expired, or missing:
                            </p>
                            <div className="space-y-2 pt-1 text-sm text-slate-600">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                                    <span><strong>Perishable Items (Vegetables, Fruits, Dairy):</strong> Report within 24 hours of delivery.</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                                    <span><strong>Packaged Goods & Essentials:</strong> Report within 48 hours in original condition with packaging intact.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Clause 3: Refund Timelines & Methods */}
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            3
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-base font-extrabold text-slate-900">Refund Processing Timelines</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Once a refund request is approved by our support team, refunds are initiated immediately to your preferred method:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 text-center">
                                    <span className="text-xs font-bold text-primary uppercase block mb-1">In-App Wallet</span>
                                    <span className="text-sm font-extrabold text-slate-800">Instant (Within 15 mins)</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                                    <span className="text-xs font-bold text-slate-700 uppercase block mb-1">UPI & NetBanking</span>
                                    <span className="text-sm font-extrabold text-slate-800">1 to 3 Business Days</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                                    <span className="text-xs font-bold text-slate-700 uppercase block mb-1">Credit / Debit Card</span>
                                    <span className="text-sm font-extrabold text-slate-800">3 to 7 Business Days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 font-medium">Need immediate assistance with an ongoing order?</span>
                    <Link to="/support" className="font-bold text-primary hover:underline">
                        Contact Customer Care &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicyPage;
