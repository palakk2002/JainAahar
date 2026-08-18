import React from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useWarehouseContext } from "../hooks/useWarehouseContext";

/**
 * @typedef {Object} WarehouseSelectorProps
 * @property {string} [selectedWarehouse]
 * @property {Function} [onChange]
 * @property {string} [className]
 */

/**
 * @param {WarehouseSelectorProps} props
 */
export const WarehouseSelector = ({ selectedWarehouse = "all", onChange = () => {}, className = "" } = {}) => {
  const { isWarehouseUser, getActiveWarehouse } = useWarehouseContext();
  const activeWhId = getActiveWarehouse(selectedWarehouse);

  const allWarehouses = [
    { id: "all", label: "All Warehouses", code: "ALL" },
    { id: "wh-indore", label: "Indore Warehouse", code: "IND" },
    { id: "wh-shivpuri", label: "Shivpuri Warehouse", code: "SVP" },
  ];

  const warehouses = isWarehouseUser
    ? allWarehouses.filter((wh) => wh.id === activeWhId)
    : allWarehouses;

  React.useEffect(() => {
    if (isWarehouseUser && selectedWarehouse === "all" && activeWhId !== "all") {
      onChange(activeWhId);
    }
  }, [isWarehouseUser, selectedWarehouse, activeWhId, onChange]);

  return (
    <div className={cn("inline-flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80", className)}>
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
        <Building2 size={13} />
        <span>Location:</span>
      </div>
      <div className="flex items-center gap-1">
        {warehouses.map((wh) => {
          const isSelected = selectedWarehouse === wh.id;
          return (
            <button
              key={wh.id}
              onClick={() => onChange(wh.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                isSelected
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200/60 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", isSelected ? "bg-primary animate-pulse" : "bg-slate-300")} />
              <span>{wh.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseSelector;
