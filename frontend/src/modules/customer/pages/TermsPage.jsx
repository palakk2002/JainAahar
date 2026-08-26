import React from 'react';
import { ChevronLeft, ScrollText, ShieldCheck, Scale } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';
import ContactDetailCard from '../components/shared/ContactDetailCard';

const TermsPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const appName = settings?.appName || 'Aahar Jain';
    const companyName = settings?.companyName || appName;

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
                        <h1 className="text-lg font-black text-slate-900 leading-tight">Terms & Conditions</h1>
                        <p className="text-[11px] text-slate-500 font-medium">Customer usage & service terms</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 max-w-3xl mx-auto space-y-5">
                {/* Hero Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-primary shadow-2xs shrink-0">
                            <Scale size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">{appName} Terms of Service</h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Last updated: August 2026</p>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Welcome to <strong className="text-slate-800">{appName}</strong>. By accessing or using our application, website, and grocery delivery services, you agree to comply with and be bound by the following Terms and Conditions.
                    </p>
                </div>

                {/* Mandatory Contact Detail Card */}
                <ContactDetailCard title="Legal & Compliance Contact" />

                {/* Terms Sections Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                    {/* Clause 1 */}
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-100 text-primary text-xs font-black flex items-center justify-center">1</span>
                            Acceptance & Eligibility
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            By creating an account or placing an order, you represent that you are at least 18 years of age or accessing under the supervision of a legal guardian. You agree to provide accurate registration information and keep your credentials confidential.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Clause 2 */}
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-100 text-primary text-xs font-black flex items-center justify-center">2</span>
                            Orders, Pricing & Product Availability
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-2">
                            All items listed on the platform are subject to real-time inventory availability in the nearest fulfillment warehouse.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 pl-2">
                            <li>Prices displayed are inclusive of applicable taxes unless stated otherwise.</li>
                            <li>In the rare event an item goes out of stock after order confirmation, a full instant refund for that item will be processed.</li>
                            <li>We reserve the right to decline or limit order quantities per household at our discretion.</li>
                        </ul>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Clause 3 */}
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-100 text-primary text-xs font-black flex items-center justify-center">3</span>
                            Payments, Wallet & Security
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            We support secure online payment methods (UPI, Credit/Debit cards, Net Banking) through RBI-authorized payment gateways, as well as Cash on Delivery (COD) in select serviceable locations.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Clause 4 */}
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-100 text-primary text-xs font-black flex items-center justify-center">4</span>
                            Intellectual Property & Fair Usage
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            All content, trademarks, brand assets, images, and user interfaces of {companyName} are legally protected. Unauthorized extraction, commercial scraping, or fraudulent exploitation of promotional offers is strictly prohibited.
                        </p>
                    </div>
                </div>

                {/* Quick Nav Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600">
                    <span>Questions regarding our service terms?</span>
                    <Link to="/support" className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
                        Visit Support & Helpline &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;


