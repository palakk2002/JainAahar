import express from "express";
import {
  createPaymentOrder,
  verifyPaymentStatus,
  verifyRazorpayPayment,
  handlePhonePeWebhook,
  handleRazorpayWebhook,
} from "../controller/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { paymentRouteRateLimiter } from "../middleware/securityMiddlewares.js";

const paymentRoute = express.Router();

/**
 * Initiate a payment order for a specific CheckoutGroupId or OrderId.
 * Auth: Required (Customer paying for their own order)
 */
paymentRoute.post(
  "/create-order",
  verifyToken,
  paymentRouteRateLimiter,
  createPaymentOrder,
);

/**
 * Verify payment status from client side (PhonePe redirect or status check).
 * Auth: Required
 */
paymentRoute.get(
  "/status/:id",
  verifyToken,
  paymentRouteRateLimiter,
  verifyPaymentStatus,
);

/**
 * Verify Razorpay payment signature from client side (after Razorpay Checkout modal completes).
 * Auth: Required
 */
paymentRoute.post(
  "/verify",
  verifyToken,
  paymentRouteRateLimiter,
  verifyRazorpayPayment,
);

/**
 * PhonePe Server-to-Server Webhook.
 * Auth: None (Internal verification via x-verify / authorization header)
 */
paymentRoute.post(
  "/webhook/phonepe",
  express.raw({ type: "application/json" }), // SDK needs raw body for verification
  handlePhonePeWebhook,
);

/**
 * Razorpay Server-to-Server Webhook.
 * Auth: None (Internal verification via x-razorpay-signature header)
 */
paymentRoute.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook,
);

export default paymentRoute;
