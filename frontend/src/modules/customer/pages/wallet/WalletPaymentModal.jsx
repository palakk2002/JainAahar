import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ShieldCheck,
    ChevronRight,
    Loader2,
    Lock,
    Zap,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    ExternalLink,
    CreditCard,
    QrCode
} from 'lucide-react';
import { customerApi } from '../../services/customerApi';
import { useToast } from '@shared/components/ui/Toast';

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export const WalletPaymentModal = ({
    isOpen,
    onClose,
    initialAmount = '500',
    onPaymentSuccess,
}) => {
    const { showToast } = useToast();
    const [amount, setAmount] = useState(initialAmount || '500');
    const [isInitiating, setIsInitiating] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount(initialAmount || '500');
            setIsInitiating(false);
            setRedirectUrl('');
            setErrorMsg('');
        }
    }, [isOpen, initialAmount]);

    const numericAmount = Number(amount) || 0;

    const handleInitiateRealPhonePePayment = async (e) => {
        if (e) e.preventDefault();
        if (numericAmount <= 0) {
            showToast("Please enter a valid amount greater than ₹0", "error");
            return;
        }
        if (numericAmount > 50000) {
            showToast("Maximum recharge limit is ₹50,000", "error");
            return;
        }

        setIsInitiating(true);
        setErrorMsg('');
        setRedirectUrl('');

        try {
            const res = await customerApi.createWalletPaymentOrder({
                amount: numericAmount,
            });

            const responseData = res?.data;
            const targetUrl =
                responseData?.result?.redirectUrl ||
                responseData?.data?.redirectUrl ||
                responseData?.redirectUrl;

            if (targetUrl) {
                setRedirectUrl(targetUrl);
                showToast("Opening PhonePe Payment Gateway...", "info");
                // Attempt automatic navigation
                try {
                    window.location.assign(targetUrl);
                } catch {
                    window.location.href = targetUrl;
                }
            } else if (responseData?.success && (responseData?.result?.walletBalance !== undefined || responseData?.message?.includes("success"))) {
                // If backend directly credited balance
                showToast(`₹${numericAmount.toLocaleString('en-IN')} added to wallet successfully!`, "success");
                if (onPaymentSuccess) {
                    onPaymentSuccess(responseData?.result?.walletBalance ?? responseData?.result, responseData?.result);
                }
                if (onClose) onClose();
            } else {
                throw new Error(
                    responseData?.message ||
                    responseData?.error ||
                    "Payment gateway did not return a valid redirect URL. Please try again."
                );
            }
        } catch (err) {
            console.error("PhonePe Wallet PG error:", err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unable to connect to PhonePe gateway. Please check your network and try again.";
            setErrorMsg(msg);
            showToast(msg, "error");
            setIsInitiating(false);
            setRedirectUrl('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm font-['Outfit',_sans-serif]"
                    onClick={() => {
                        if (!isInitiating) onClose();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 80, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with Official PhonePe Branding */}
                        <div className="bg-gradient-to-r from-[#5f259f] via-[#6d28d9] to-[#4c1d95] text-white px-5 py-4 flex items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-serif font-black text-2xl shadow-inner select-none">
                                    <span>पे</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-black tracking-tight leading-tight flex items-center gap-1.5">
                                        <span>Add Money via PhonePe</span>
                                        <Sparkles size={14} className="text-yellow-300 fill-yellow-300" />
                                    </h3>
                                    <p className="text-[11px] text-purple-200 font-medium leading-none mt-0.5">
                                        Official UPI & Payment Gateway
                                    </p>
                                </div>
                            </div>

                            {!isInitiating && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Redirecting Overlay State */}
                        {redirectUrl ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-[#5f259f] relative shadow-inner">
                                    <Loader2 size={36} className="animate-spin" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900">Redirecting to PhonePe</h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        Opening secure payment screen for ₹{numericAmount.toLocaleString('en-IN')}...
                                    </p>
                                </div>

                                <a
                                    href={redirectUrl}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-[#5f259f] bg-purple-50 hover:bg-purple-100 px-4 py-2.5 rounded-xl border border-purple-200 transition-colors"
                                >
                                    <span>Click here if not redirected</span>
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        ) : (
                            /* Body Content */
                            <div className="p-5 space-y-5">
                                {errorMsg && (
                                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle size={18} className="shrink-0 text-rose-600" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                <form onSubmit={handleInitiateRealPhonePePayment} className="space-y-4">
                                    {/* Amount Input */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                            Enter Top-Up Amount
                                        </label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-4 text-3xl font-black text-slate-400 select-none">₹</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="50000"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0"
                                                disabled={isInitiating}
                                                autoFocus
                                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-3xl font-black text-slate-900 focus:outline-none focus:border-[#5f259f] focus:bg-white transition-all placeholder:text-slate-300 disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    {/* Quick Presets */}
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Quick Select
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {PRESET_AMOUNTS.map((amt) => {
                                                const isSelected = String(amt) === String(amount);
                                                return (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        disabled={isInitiating}
                                                        onClick={() => setAmount(String(amt))}
                                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-purple-50 border-[#5f259f] text-[#5f259f] shadow-2xs ring-1 ring-[#5f259f]/20 font-black'
                                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        +₹{amt.toLocaleString('en-IN')}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Supported Payment Channels in PhonePe Gateway */}
                                    <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 text-left space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-purple-950 uppercase tracking-wider">
                                                Supported via PhonePe Gateway
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                Instant Credit
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#5f259f]" />
                                                <span>PhonePe UPI & QR</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                                                <span>Google Pay (GPay)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00b9f5]" />
                                                <span>Paytm & Any UPI App</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                <span>Debit/Credit Cards & NetBanking</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guarantee Security */}
                                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium px-1">
                                        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                                        <span>100% RBI & Bank Certified Payment Gateway. Zero extra convenience fee.</span>
                                    </div>

                                    {/* Action Pay Button */}
                                    <button
                                        type="submit"
                                        disabled={isInitiating || numericAmount <= 0}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#5f259f] to-[#4c1d95] hover:from-[#5f259f]/95 hover:to-[#4c1d95]/95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isInitiating ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin text-white" />
                                                <span>Connecting to PhonePe...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={16} />
                                                <span>Proceed to Pay ₹{numericAmount.toLocaleString('en-IN')} via PhonePe</span>
                                                <ChevronRight size={18} strokeWidth={3} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WalletPaymentModal;
