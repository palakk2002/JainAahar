import Customer from "../models/customer.js";
import Cart from "../models/cart.js";
import Wishlist from "../models/wishlist.js";
import Transaction from "../models/transaction.js";
import jwt from "jsonwebtoken";
import handleResponse from "../utils/helper.js";
import { creditWallet } from "../services/finance/walletService.js";
import { OWNER_TYPE, LEDGER_TRANSACTION_TYPE } from "../constants/finance.js";
import {
    issueCustomerOtp,
    sanitizeCustomer,
    verifyCustomerOtpCode,
} from "../services/otpAuthService.js";
import {
    sendLoginOtpSchema,
    sendSignupOtpSchema,
    validateSchema,
    verifyOtpSchema,
} from "../validation/customerAuthValidation.js";

const generateToken = (customer) =>
    jwt.sign(
        { id: customer._id, role: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

/* ===============================
   SIGNUP – Send OTP
================================ */
export const signupCustomer = async (req, res) => {
    try {
        const payload = validateSchema(sendSignupOtpSchema, req.body || {});

        await issueCustomerOtp({
            name: payload.name,
            rawPhone: payload.phone,
            email: payload.email,
            flow: "signup",
            referralCode: payload.referralCode,
            ipAddress: req.ip,
        });

        return handleResponse(res, 200, "OTP has been sent successfully");
    } catch (error) {
        return handleResponse(res, error.statusCode || 500, error.message);
    }
};

/* ===============================
   LOGIN – Send OTP
================================ */
export const loginCustomer = async (req, res) => {
    try {
        const payload = validateSchema(sendLoginOtpSchema, req.body || {});

        await issueCustomerOtp({
            rawPhone: payload.phone,
            email: payload.email,
            flow: "login",
            ipAddress: req.ip,
        });

        return handleResponse(res, 200, "OTP has been sent successfully");
    } catch (error) {
        return handleResponse(res, error.statusCode || 500, error.message);
    }
};

/* ===============================
   VERIFY OTP – Login / Signup
================================ */
export const verifyCustomerOTP = async (req, res) => {
    try {
        const payload = validateSchema(verifyOtpSchema, req.body || {});
        const customer = await verifyCustomerOtpCode({
            rawPhone: payload.phone,
            email: payload.email,
            otp: payload.otp,
            ipAddress: req.ip,
        });
        const token = generateToken(customer);

        return handleResponse(
            res,
            200,
            "Login successful",
            {
                token,
                customer: sanitizeCustomer(customer),
            }
        );
    } catch (error) {
        return handleResponse(res, error.statusCode || 500, error.message);
    }
};

/* ===============================
   GET PROFILE
================================ */
export const getCustomerProfile = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return handleResponse(res, 404, "Customer not found");
        }
        return handleResponse(res, 200, "Profile fetched successfully", customer);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   UPDATE PROFILE
================================ */
export const updateCustomerProfile = async (req, res) => {
    try {
        const { name, email, addresses } = req.body;

        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return handleResponse(res, 404, "Customer not found");
        }

        if (name) customer.name = name;
        if (email) customer.email = email;
        if (addresses) customer.addresses = addresses;

        await customer.save();

        return handleResponse(res, 200, "Profile updated successfully", customer);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   DELETE ACCOUNT
================================ */
export const deleteCustomerAccount = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return handleResponse(res, 404, "Customer not found");
        }

        // Clean up Cart and Wishlist
        await Promise.allSettled([
            Cart.deleteMany({ customerId: req.user.id }),
            Wishlist.deleteMany({ customerId: req.user.id }),
            Customer.findByIdAndDelete(req.user.id)
        ]);

        return handleResponse(res, 200, "Account deleted successfully");
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   GET WALLET TRANSACTIONS
================================ */
export const getCustomerTransactions = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));
        const perPage = Math.min(50, Math.max(1, parseInt(limit, 10)));

        const [transactions, total] = await Promise.all([
            Transaction.find({ user: customerId, userModel: "User" })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .populate("order", "orderId")
                .lean(),
            Transaction.countDocuments({ user: customerId, userModel: "User" }),
        ]);

        const items = transactions.map((t) => {
            const isCredit = t.type === "Refund" || t.type === "Wallet Topup" || t.type === "Wallet Refund" || t.type === "Incentive" || t.type === "Bonus" || (t.amount || 0) > 0;
            let displayTitle = t.type;
            if (t.type === "Wallet Topup") displayTitle = "Money Added";
            else if (t.type === "Refund" || t.type === "Wallet Refund") displayTitle = "Refund Credited";
            else if (t.type === "Wallet Payment" || t.type === "Order Payment") displayTitle = "Order Payment";

            return {
                _id: t._id,
                type: isCredit ? "credit" : "debit",
                title: displayTitle,
                amount: Math.abs(t.amount || 0),
                date: t.createdAt || t.date,
                reference: t.reference,
                orderId: t.order?.orderId,
            };
        });

        return handleResponse(res, 200, "Transactions fetched", {
            items,
            total,
            page: parseInt(page, 10),
            totalPages: Math.ceil(total / perPage) || 1,
        });
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   ADD WALLET MONEY (TOPUP)
================================ */
export const addCustomerWalletMoney = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { amount } = req.body || {};
        const parsedAmount = Number(amount);

        if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
            return handleResponse(res, 400, "Please enter a valid amount greater than ₹0");
        }

        if (parsedAmount > 50000) {
            return handleResponse(res, 400, "Maximum limit per wallet topup is ₹50,000");
        }

        // 1. Credit canonical wallet (automatically syncs User.walletBalance)
        const creditResult = await creditWallet({
            ownerType: OWNER_TYPE.CUSTOMER,
            ownerId: customerId,
            bucket: "available",
            amount: parsedAmount,
            ledgerType: LEDGER_TRANSACTION_TYPE.WALLET_TOPUP,
            ledgerDescription: `Added ₹${parsedAmount} to wallet`,
            metadata: { source: "customer_add_money", timestamp: new Date() },
        });

        // 2. Dual-write legacy Transaction row for frontend transaction listing
        const reference = `W-TOPUP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await Transaction.create({
            user: customerId,
            userModel: "User",
            type: "Wallet Topup",
            amount: parsedAmount,
            status: "Settled",
            reference,
            date: new Date(),
            meta: { source: "online_topup" },
        });

        const updatedBalance = creditResult?.after ?? 0;

        return handleResponse(res, 200, `₹${parsedAmount} added to wallet successfully!`, {
            walletBalance: updatedBalance,
            amount: parsedAmount,
            transactionId: reference,
        });
    } catch (error) {
        console.error("Error adding wallet money:", error);
        return handleResponse(res, 500, error.message || "Failed to add money to wallet");
    }
};
