import React from "react";
import Badge from "@shared/components/ui/Badge";

/**
 * @typedef {Object} MovementTypeBadgeProps
 * @property {string} [type]
 * @property {string} [className]
 */

/**
 * @param {MovementTypeBadgeProps} props
 */
export const MovementTypeBadge = ({ type = "", className = "" } = {}) => {
  if (!type) return null;

  const map = {
    "Stock Inward": { variant: "success", label: "Stock Inward" },
    INWARD: { variant: "success", label: "Stock Inward" },
    "Customer Order": { variant: "info", label: "Customer Order" },
    OUTWARD: { variant: "info", label: "Stock Outward" },
    FULFILLMENT: { variant: "info", label: "Fulfillment" },
    Return: { variant: "warning", label: "Return" },
    RETURN_RESTOCK: { variant: "warning", label: "Return Restock" },
    Transfer: { variant: "primary", label: "Transfer" },
    TRANSFER_IN: { variant: "primary", label: "Transfer In" },
    TRANSFER_OUT: { variant: "primary", label: "Transfer Out" },
    Damaged: { variant: "error", label: "Damaged" },
    DAMAGED: { variant: "error", label: "Damaged" },
    Defective: { variant: "error", label: "Defective" },
    DEFECTIVE: { variant: "error", label: "Defective" },
    Adjustment: { variant: "gray", label: "Adjustment" },
    ADJUSTMENT_INCREASE: { variant: "success", label: "Adj (+)" },
    ADJUSTMENT_DECREASE: { variant: "warning", label: "Adj (-)" },
    RESERVATION: { variant: "secondary", label: "Reserved" },
    RESERVATION_RELEASE: { variant: "secondary", label: "Release" },
  };

  const config = map[type] || map[String(type).toUpperCase()] || { variant: "gray", label: type };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default MovementTypeBadge;
