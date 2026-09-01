/**
 * WhatsApp Business Integration Constants
 */

export const WHATSAPP_EVENTS = Object.freeze({
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  ORDER_PACKED: "ORDER_PACKED",
  SHIPMENT_CREATED: "SHIPMENT_CREATED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  DELIVERY_FAILED: "DELIVERY_FAILED",
  REFUND_INITIATED: "REFUND_INITIATED",
  REFUND_COMPLETED: "REFUND_COMPLETED",
});

/**
 * Standard Approved Template Names
 * These map to approved template names in Meta WhatsApp Business Manager.
 */
export const WHATSAPP_TEMPLATES = Object.freeze({
  [WHATSAPP_EVENTS.ORDER_PLACED]: "order_placed",
  [WHATSAPP_EVENTS.ORDER_CONFIRMED]: "order_confirmed",
  [WHATSAPP_EVENTS.PAYMENT_SUCCESS]: "payment_successful",
  [WHATSAPP_EVENTS.PAYMENT_FAILED]: "payment_failed",
  [WHATSAPP_EVENTS.ORDER_PACKED]: "order_packed",
  [WHATSAPP_EVENTS.SHIPMENT_CREATED]: "shipment_created",
  [WHATSAPP_EVENTS.ORDER_SHIPPED]: "order_shipped",
  [WHATSAPP_EVENTS.OUT_FOR_DELIVERY]: "out_for_delivery",
  [WHATSAPP_EVENTS.ORDER_DELIVERED]: "order_delivered",
  [WHATSAPP_EVENTS.ORDER_CANCELLED]: "order_cancelled",
  [WHATSAPP_EVENTS.DELIVERY_FAILED]: "delivery_failed",
  [WHATSAPP_EVENTS.REFUND_INITIATED]: "refund_initiated",
  [WHATSAPP_EVENTS.REFUND_COMPLETED]: "refund_completed",
});

export const WHATSAPP_MESSAGE_STATUS = Object.freeze({
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
  SKIPPED: "skipped",
});

export const DEFAULT_WHATSAPP_EVENT_TOGGLES = Object.freeze({
  orderPlaced: true,
  orderConfirmed: true,
  paymentSuccess: true,
  paymentFailed: true,
  orderPacked: true,
  shipmentCreated: true,
  orderShipped: true,
  outForDelivery: true,
  orderDelivered: true,
  orderCancelled: true,
  deliveryFailed: true,
  refundInitiated: true,
  refundCompleted: true,
});

/**
 * Maps WHATSAPP_EVENTS to the corresponding toggle key in settings
 */
export const EVENT_TO_SETTING_KEY = Object.freeze({
  [WHATSAPP_EVENTS.ORDER_PLACED]: "orderPlaced",
  [WHATSAPP_EVENTS.ORDER_CONFIRMED]: "orderConfirmed",
  [WHATSAPP_EVENTS.PAYMENT_SUCCESS]: "paymentSuccess",
  [WHATSAPP_EVENTS.PAYMENT_FAILED]: "paymentFailed",
  [WHATSAPP_EVENTS.ORDER_PACKED]: "orderPacked",
  [WHATSAPP_EVENTS.SHIPMENT_CREATED]: "shipmentCreated",
  [WHATSAPP_EVENTS.ORDER_SHIPPED]: "orderShipped",
  [WHATSAPP_EVENTS.OUT_FOR_DELIVERY]: "outForDelivery",
  [WHATSAPP_EVENTS.ORDER_DELIVERED]: "orderDelivered",
  [WHATSAPP_EVENTS.ORDER_CANCELLED]: "orderCancelled",
  [WHATSAPP_EVENTS.DELIVERY_FAILED]: "deliveryFailed",
  [WHATSAPP_EVENTS.REFUND_INITIATED]: "refundInitiated",
  [WHATSAPP_EVENTS.REFUND_COMPLETED]: "refundCompleted",
});
