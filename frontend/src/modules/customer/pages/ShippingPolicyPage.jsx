import React from 'react';
import { Truck, Clock, MapPin, PackageCheck, AlertCircle, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';
import ContactDetailCard from '../components/shared/ContactDetailCard';

const ShippingPolicyPage = () => {
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
                        <h1 className="text-lg font-black text-slate-900 leading-tight">Shipping & Delivery Policy</h1>
                        <p className="text-[11px] text-slate-500 font-medium">Delivery areas, timelines, and charges</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 max-w-3xl mx-auto space-y-5">
                {/* Hero Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-primary shadow-2xs shrink-0">
                            <Truck size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">{appName} Shipping Policy</h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Last updated: August 2026</p>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        At <strong className="text-slate-800">{appName}</strong>, we are committed to delivering your fresh groceries, organic items, and household essentials in the quickest, safest, and most hygienic manner possible.
                    </p>
                </div>

                {/* Contact Card */}
                <ContactDetailCard title="Shipping & Logistics Support" />

                {/* Shipping Details Content */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                    {/* Section 1 */}
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            1
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-base font-extrabold text-slate-900">Serviceable Delivery Areas</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We currently service major residential and commercial sectors in our designated operational cities. Delivery availability is automatically verified based on your selected address and GPS pin location before placing an order.
                            </p>
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-primary shrink-0" />
                                    Location Verification
                                </p>
                                <p>If your location is currently non-serviceable, our team is continuously expanding. Please check back regularly or contact our support team.</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 2 */}
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            2
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-base font-extrabold text-slate-900">Delivery Timelines</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We offer fast, reliable delivery designed to cater to your urgent daily needs as well as planned orders:
                            </p>
                            <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 pl-1">
                                <li><strong className="text-slate-800">Quick Delivery:</strong> Estimated delivery within 15 to 45 minutes for priority hyper-local zones (subject to traffic & weather conditions).</li>
                                <li><strong className="text-slate-800">Slot-based Delivery:</strong> Scheduled orders delivered during your chosen delivery time window.</li>
                                <li><strong className="text-slate-800">Operating Hours:</strong> Orders are accepted and dispatched 7 days a week from 6:00 AM to 11:00 PM.</li>
                            </ul>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 3 */}
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            3
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-base font-extrabold text-slate-900">Shipping & Handling Charges</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Delivery charges, if applicable, are transparently displayed on the checkout screen before you complete payment:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="p-3.5 bg-brand-50/60 rounded-2xl border border-brand-100">
                                    <span className="text-xs font-bold text-primary block mb-1">Standard Orders</span>
                                    <span className="text-sm font-semibold text-slate-700">Free delivery on orders meeting the minimum order threshold shown in app.</span>
                                </div>
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                    <span className="text-xs font-bold text-slate-800 block mb-1">Nominal Fee</span>
                                    <span className="text-sm font-semibold text-slate-600">A small convenience / distance fee may apply to smaller cart values or peak rainy hours.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Section 4 */}
                    <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-brand-100 text-primary font-black text-sm flex items-center justify-center shrink-0">
                            4
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-base font-extrabold text-slate-900">Order Tracking & Contactless Delivery</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Once your order is packed and assigned to a delivery partner, you can track its real-time location on the app. We also support Contactless Delivery — simply select the option at checkout or notify your delivery rider.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Related Links */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600 font-medium">Looking for Return or Cancellation terms?</span>
                    <Link to="/cancellation-refund-policy" className="font-bold text-primary hover:underline">
                        Cancellation & Refund Policy &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicyPage;
