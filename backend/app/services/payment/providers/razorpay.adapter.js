/**
 * RazorpayAdapter
 *
 * Implements PaymentProviderPort for Razorpay Payment Gateway.
 * Provides server-side order creation, signature verification, webhook handling,
 * and status mapping.
 */

import crypto from "crypto";
import Razorpay from "razorpay";
import { PAYMENT_STATUS, PAYMENT_GATEWAY } from "../../../constants/payment.js";
import { PaymentProviderPort } from "../ports/paymentProviderPort.js";

let _razorpayClient = null;

function getRazorpayCredentials() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  const webhookSecret = String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) not configured");
  }

  return { keyId, keySecret, webhookSecret };
}

function getRazorpayClient() {
  if (_razorpayClient) return _razorpayClient;
  const { keyId, keySecret } = getRazorpayCredentials();
  _razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  return _razorpayClient;
}

export class RazorpayAdapter extends PaymentProviderPort {
  get providerName() {
    return PAYMENT_GATEWAY.RAZORPAY || "RAZORPAY";
  }

  get keyId() {
    const { keyId } = getRazorpayCredentials();
    return keyId;
  }

  /**
   * Create Razorpay Order on server side.
   * Accepts amount in smallest currency unit (paise for INR).
   */
  async initiatePayment({ merchantOrderId, amountPaise, redirectUrl }) {
    const razorpay = getRazorpayClient();
    const { keyId } = getRazorpayCredentials();

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: merchantOrderId,
      notes: {
        merchantOrderId,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return {
      razorpayOrderId: razorpayOrder.id,
      merchantOrderId,
      amountPaise: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      redirectUrl: null,
      gatewayResponse: razorpayOrder,
    };
  }

  /**
   * Verify Razorpay payment signature returned from frontend Checkout modal.
   * HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, keySecret) === razorpaySignature
   */
  verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }
    const { keySecret } = getRazorpayCredentials();
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(razorpaySignature, "utf8"),
    );
  }

  /**
   * Fetch payment/order status from Razorpay API.
   */
  async getPaymentStatus({ merchantOrderId, razorpayOrderId }) {
    const razorpay = getRazorpayClient();
    const orderIdToFetch = razorpayOrderId || merchantOrderId;

    if (!orderIdToFetch) {
      throw new Error("Razorpay order ID required for status check");
    }

    const order = await razorpay.orders.fetch(orderIdToFetch);
    let lastPayment = null;

    if (order.status === "paid" || order.attempts > 0) {
      const payments = await razorpay.orders.fetchPayments(orderIdToFetch);
      if (payments && payments.items && payments.items.length > 0) {
        lastPayment = payments.items[0];
      }
    }

    return {
      state: order.status, // 'created', 'attempted', 'paid'
      transactionId: lastPayment ? lastPayment.id : null,
      responseCode: order.status,
      gatewayResponse: { order, lastPayment },
    };
  }

  /**
   * Validate Razorpay Webhook signature using RAZORPAY_WEBHOOK_SECRET.
   */
  async validateWebhook({ rawBody, authorization }) {
    const { webhookSecret } = getRazorpayCredentials();
    if (!webhookSecret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");
    }

    const signature = authorization; // x-razorpay-signature header passed as authorization
    if (!signature) {
      return false;
    }

    const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawString)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8"),
    );
  }

  /**
   * Decode raw webhook payload into standardized format.
   */
  async decodeWebhookPayload({ rawBody }) {
    const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
    let jsonPayload;
    try {
      jsonPayload = JSON.parse(rawString);
    } catch {
      const err = new Error("Invalid format: Webhook body must be JSON");
      err.statusCode = 400;
      throw err;
    }

    const event = jsonPayload.event || "";
    const payloadEntity = jsonPayload.payload?.payment?.entity || jsonPayload.payload?.order?.entity || {};

    const merchantOrderId =
      payloadEntity.notes?.merchantOrderId ||
      payloadEntity.receipt ||
      null;

    const razorpayOrderId = payloadEntity.order_id || payloadEntity.id || null;
    const paymentId = payloadEntity.id || null;
    const eventId =
      jsonPayload.account_id && jsonPayload.created_at && event
        ? `${jsonPayload.account_id}_${jsonPayload.created_at}_${event}`
        : crypto
            .createHash("sha256")
            .update(rawString)
            .digest("hex");

    return {
      eventId,
      merchantOrderId,
      razorpayOrderId,
      state: event, // e.g. 'payment.captured', 'payment.failed', 'order.paid'
      transactionId: paymentId,
      responseCode: payloadEntity.error_code || event,
      raw: jsonPayload,
    };
  }

  /**
   * Map Razorpay status / event to internal PAYMENT_STATUS.
   */
  mapStatusToInternal(gatewayState) {
    const normalized = String(gatewayState || "").toLowerCase();

    if (
      normalized === "paid" ||
      normalized === "captured" ||
      normalized === "payment.captured" ||
      normalized === "order.paid"
    ) {
      return PAYMENT_STATUS.CAPTURED;
    }

    if (
      normalized === "failed" ||
      normalized === "payment.failed"
    ) {
      return PAYMENT_STATUS.FAILED;
    }

    if (
      normalized === "refunded" ||
      normalized === "payment.refunded"
    ) {
      return PAYMENT_STATUS.REFUNDED;
    }

    return PAYMENT_STATUS.PENDING;
  }
}

export default RazorpayAdapter;
