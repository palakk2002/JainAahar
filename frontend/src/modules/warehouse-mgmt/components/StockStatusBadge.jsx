import React from "react";
import Badge from "@shared/components/ui/Badge";

/**
 * @typedef {Object} StockStatusBadgeProps
 * @property {string} [status]
 * @property {string} [className]
 */

/**
 * @param {StockStatusBadgeProps} props
 */
export const StockStatusBadge = ({ status = "", className = "" } = {}) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  let variant = "gray";
  let label = status;

  if (normalized.includes("in stock") || normalized === "active") {
    variant = "success";
    label = "In Stock";
  } else if (normalized.includes("low stock")) {
    variant = "warning";
    label = "Low Stock";
  } else if (normalized.includes("out of stock") || normalized === "critical") {
    variant = "error";
    label = "Out of Stock";
  } else if (normalized.includes("damaged") || normalized.includes("defective")) {
    variant = "error";
    label = status;
  } else if (normalized.includes("transit")) {
    variant = "info";
    label = "In Transit";
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

export default StockStatusBadge;
