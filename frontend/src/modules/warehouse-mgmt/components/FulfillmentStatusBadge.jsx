import React from "react";
import Badge from "@shared/components/ui/Badge";

/**
 * @typedef {Object} FulfillmentStatusBadgeProps
 * @property {string} [status]
 * @property {string} [className]
 */

/**
 * @param {FulfillmentStatusBadgeProps} props
 */
export const FulfillmentStatusBadge = ({ status = "", className = "" } = {}) => {
  if (!status) return null;

  const map = {
    Pending: { variant: "warning", label: "Pending" },
    Confirmed: { variant: "info", label: "Confirmed" },
    Picking: { variant: "info", label: "Picking" },
    Packed: { variant: "primary", label: "Packed" },
    "Ready for Shipment": { variant: "primary", label: "Ready for Shipment" },
    Shipped: { variant: "info", label: "Shipped" },
    Completed: { variant: "success", label: "Completed" },
    Cancelled: { variant: "error", label: "Cancelled" },
    Returned: { variant: "error", label: "Returned" },
  };

  const config = map[status] || { variant: "gray", label: status };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default FulfillmentStatusBadge;
