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
    "Customer Order": { variant: "info", label: "Customer Order" },
    Return: { variant: "warning", label: "Return" },
    Transfer: { variant: "primary", label: "Transfer" },
    Damaged: { variant: "error", label: "Damaged" },
    Defective: { variant: "error", label: "Defective" },
    Adjustment: { variant: "gray", label: "Adjustment" },
  };

  const config = map[type] || { variant: "gray", label: type };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default MovementTypeBadge;
