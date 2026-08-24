import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, Wallet, ArrowRight, Plus, X, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { customerApi } from '../services/customerApi';
import { useToast } from '@shared/components/ui/Toast';

const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

let cachedWalletData = null;

const WalletPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [balance, setBalance] = useState(() => cachedWalletData?.balance ?? 0);
    const [transactions, setTransactions] = useState(() => cachedWalletData?.transactions ?? []);
    const [loading, setLoading] = useState(() => !cachedWalletData);

    // Modal state for Add Money
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addAmount, setAddAmount] = useState('500');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async (showLoadingState = false) => {
        if (showLoadingState || !cachedWalletData) {
            setLoading(true);
        }
        try {
            const [profileRes, txRes] = await Promise.all([
                customerApi.getProfile().catch(() => null),
                customerApi.getWalletTransactions().catch(() => null),
            ]);

            const profile = profileRes?.data?.result ?? profileRes?.data?.data ?? profileRes?.data;
            const currentBal = profile?.walletBalance ?? 0;
            setBalance(currentBal);

            // Check if server returned wallet transactions (handleResponse wraps in result.items)
            const txResult = txRes?.data?.result ?? txRes?.data?.data ?? txRes?.data;
            const txItems = Array.isArray(txResult?.items)
                ? txResult.items
                : Array.isArray(txResult)
                ? txResult
                : (Array.isArray(txRes?.data?.items) ? txRes.data.items : []);

            const finalTxList = Array.isArray(txItems) ? txItems : [];
            setTransactions(finalTxList);

            cachedWalletData = {
                balance: currentBal,
                transactions: finalTxList,
            };
        } catch (err) {
            console.error('Wallet fetch error:', err);
            if (!cachedWalletData) {
                setBalance(0);
                setTransactions([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddMoneySubmit = async (e) => {
        if (e) e.preventDefault();
        const numericAmount = Number(addAmount);
        if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
            showToast("Please enter a valid amount greater than ₹0", "error");
            return;
        }
        if (numericAmount > 50000) {
            showToast("Maximum limit per transaction is ₹50,000", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await customerApi.addWalletMoney({ amount: numericAmount });
            const responseData = res.data;
            if (responseData?.success || responseData?.status === 200 || responseData?.statusCode === 200) {
                const newBal = responseData?.result?.walletBalance ?? responseData?.data?.walletBalance ?? responseData?.walletBalance ?? (balance + numericAmount);
                setBalance(newBal);
                showToast(`₹${numericAmount.toLocaleString('en-IN')} added to your wallet!`, "success");
                setIsAddModalOpen(false);
                setAddAmount('500');
                // Refresh transactions list freshly
                await fetchData();
            } else {
                showToast(responseData?.message || "Failed to add money to wallet", "error");
            }
        } catch (err) {
            console.error("Add money error:", err);
            const errMsg = err.response?.data?.message || "Failed to add money. Please try again.";
            showToast(errMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-16 font-['Outfit',_sans-serif]">
            {/* Top Navigation */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 pt-4 pb-2 border-b border-slate-100 mb-2 flex items-center gap-2">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors -ml-1"
                >
                    <ChevronLeft size={22} className="text-slate-800" />
                </button>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Wallet</h1>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-1 relative z-20 space-y-4">
                {/* Wallet Balance Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex items-center justify-between overflow-hidden relative">
                    {/* Left Column */}
                    <div className="flex flex-col items-start text-left">
                        <p className="text-xs font-bold text-slate-800 tracking-tight">My Wallet</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1.5 leading-none tracking-tight">
                            {loading ? '...' : `₹${(balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1.5 leading-none">Wallet Balance</p>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-5 h-9 px-5 rounded-full bg-gradient-to-r from-[#2e7d32] to-[#1b5e20] hover:from-[#2e7d32]/95 hover:to-[#1b5e20]/95 text-white font-black text-[11px] flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95 transition-all select-none cursor-pointer"
                        >
                            <span>Add Money</span>
                            <ArrowRight size={13} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Right Column */}
                    <div className="w-[160px] h-[130px] flex items-center justify-center shrink-0">
                        <img
                            src="/wallet iamge .png"
                            alt="Wallet Illustration"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Transaction History Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800">Transaction History</h3>
                        <div className="w-10 h-10 rounded-full bg-teal-50/80 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                            <span className="text-lg">👛</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-8 flex justify-center text-slate-400 text-sm font-semibold">
                            <Loader2 className="animate-spin text-slate-400 mr-2" size={18} /> Loading wallet history...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-2xl mb-2">
                                💳
                            </div>
                            <p className="text-sm font-semibold text-slate-600 mb-1">No wallet payments yet</p>
                            <p className="text-xs text-slate-400 max-w-xs">
                                Top ups & orders paid using wallet balance will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {transactions.map((tx) => {
                                const isCredit = tx.type === 'credit';
                                return (
                                    <div key={tx._id} className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-2xs shrink-0 ${isCredit ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                                                {isCredit ? (
                                                    <ArrowDownLeft size={20} className="text-emerald-600" />
                                                ) : (
                                                    <ArrowUpRight size={20} className="text-slate-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{tx.title}</h4>
                                                <p className="text-[11px] font-medium text-slate-500">{formatDate(tx.date)}</p>
                                                {tx.orderId && (
                                                    <p className="text-[10px] text-slate-400">Order #{tx.orderId}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {isCredit ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Money Modal Sheet */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">Add Money to Wallet</h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">Instant credit for fast checkout</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddMoneySubmit} className="space-y-5">
                            {/* Input Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Enter Amount
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-2xl font-black text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50000"
                                        value={addAmount}
                                        onChange={(e) => setAddAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:outline-none focus:border-[#2e7d32] focus:bg-white transition-all placeholder:text-slate-300"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Quick Preset Amount Chips */}
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Quick Select
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {PRESET_AMOUNTS.map((amt) => {
                                        const isSelected = String(amt) === String(addAmount);
                                        return (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setAddAmount(String(amt))}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                                    isSelected
                                                        ? 'bg-emerald-50 border-[#2e7d32] text-[#2e7d32] shadow-2xs'
                                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                +₹{amt.toLocaleString('en-IN')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Guarantee / Security badge */}
                            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 font-medium">
                                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                                <span>100% safe & secure instant payment.</span>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !addAmount || Number(addAmount) <= 0}
                                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#2e7d32] to-[#1b5e20] hover:from-[#2e7d32]/95 hover:to-[#1b5e20]/95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Adding Money...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} strokeWidth={3} />
                                        <span>Add ₹{Number(addAmount || 0).toLocaleString('en-IN')} to Wallet</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletPage;
