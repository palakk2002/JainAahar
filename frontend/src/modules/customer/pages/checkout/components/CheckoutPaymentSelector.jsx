import React from "react";
import { Wallet, CreditCard, Banknote, Check } from "lucide-react";
import { motion } from "framer-motion";

/**
 * CheckoutPaymentSelector
 *
 * Props:
 *   paymentMethods    – array of { id, label, icon, sublabel }
 *   selectedPayment   – string id of the currently selected method
 *   onSelectPayment   – (id) => void
 *   useWallet         – boolean
 *   onToggleWallet    – () => void
 *   walletBalance     – number (0 means wallet section is hidden)
 *   walletAmountToUse – number
 *   finalAmountToPay  – number (optional)
 */
function CheckoutPaymentSelector({
  paymentMethods = [],
  selectedPayment = "",
  onSelectPayment,
  useWallet = false,
  onToggleWallet,
  walletBalance = 0,
  walletAmountToUse = 0,
  finalAmountToPay,
}) {
  const numericWalletBalance = Number(walletBalance) || 0;
  const numericWalletToUse = Number(walletAmountToUse) || 0;
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
  const isFullyCoveredByWallet = useWallet && numericWalletToUse > 0 && finalAmountToPay === 0;

  return (
    <div className="space-y-4">
      {/* Wallet Section */}
      {numericWalletBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">
                  Use Wallet Balance
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Available: ₹{numericWalletBalance.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle wallet balance usage"
              aria-pressed={useWallet}
              onClick={() => onToggleWallet && onToggleWallet()}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative flex items-center px-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                useWallet ? "bg-primary" : "bg-slate-200"
              }`}>
              <motion.div
                animate={{ x: useWallet ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="h-4 w-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>

          {useWallet && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-2 border-t border-slate-50 mt-2">
              <div className="flex justify-between items-center bg-emerald-50/60 border border-emerald-100/60 p-2.5 rounded-xl">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                  Deducted from Wallet
                </span>
                <span className="text-[13px] font-black text-emerald-700">
                  - ₹{numericWalletToUse.toLocaleString("en-IN")}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">
            Payment Method
          </h3>
          {isFullyCoveredByWallet && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Check size={12} /> Paid by Wallet
            </span>
          )}
        </div>

        {isFullyCoveredByWallet ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center gap-3.5 shadow-sm">
            <div className="h-11 w-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Check size={22} className="stroke-[3]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-emerald-900 tracking-tight">
                100% Covered by Wallet Balance
              </p>
              <p className="text-xs text-emerald-700 font-medium mt-0.5 leading-relaxed">
                ₹{numericWalletToUse.toLocaleString("en-IN")} will be deducted from your wallet. No Online or Cash payment required!
              </p>
            </div>
          </div>
        ) : safePaymentMethods.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 font-medium">
            No payment methods currently available.
          </div>
        ) : (
          <div className="space-y-2.5">
            {safePaymentMethods.map((method) => {
              const isSelected = selectedPayment === method.id;
              const Icon = method.icon;

              return (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => onSelectPayment && onSelectPayment(method.id)}
                  className={`w-full p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    isSelected
                      ? "border-primary bg-brand-50/60 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}>
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                      isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                    {Icon ? (
                      typeof Icon === "function" || typeof Icon === "object" ? (
                        <Icon size={18} />
                      ) : (
                        Icon
                      )
                    ) : method.id === "online" ? (
                      <CreditCard size={18} />
                    ) : (
                      <Banknote size={18} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-bold text-sm truncate ${
                        isSelected ? "text-primary" : "text-slate-800"
                      }`}>
                      {method.label || (method.id === "online" ? "Pay Online" : "Cash on Delivery")}
                    </p>
                    {method.sublabel && (
                      <p className="text-xs text-slate-500 truncate">{method.sublabel}</p>
                    )}
                  </div>

                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-primary bg-primary" : "border-slate-300"
                    }`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default React.memo(CheckoutPaymentSelector);
