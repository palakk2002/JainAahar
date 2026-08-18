import React from "react";
import Badge from "@shared/components/ui/Badge";

/**
 * @typedef {Object} TransferStatusBadgeProps
 * @property {string} [status]
 * @property {string} [className]
 */

/**
 * @param {TransferStatusBadgeProps} props
 */
export const TransferStatusBadge = ({ status = "", className = "" } = {}) => {
  if (!status) return null;

  const map = {
    Requested: { variant: "warning", label: "Requested" },
    Approved: { variant: "info", label: "Approved" },
    Dispatched: { variant: "primary", label: "Dispatched" },
    "In Transit": { variant: "primary", label: "In Transit" },
    Received: { variant: "success", label: "Received" },
    Cancelled: { variant: "error", label: "Cancelled" },
  };

  const config = map[status] || { variant: "gray", label: status };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default TransferStatusBadge;
