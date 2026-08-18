import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";

/**
 * @typedef {Object} WarehouseSelectorProps
 * @property {string} [selectedWarehouse]
 * @property {Function} [onChange]
 * @property {string} [className]
 */

/**
 * @param {WarehouseSelectorProps} props
 */
export const WarehouseSelector = ({
  selectedWarehouse = "all",
  onChange = () => {},
  className = "",
} = {}) => {
  const { isWarehouseUser, warehouseId, warehouseName } = useWarehouseContext();
  const [warehouseList, setWarehouseList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (isWarehouseUser && warehouseId) {
      setWarehouseList([
        {
          id: warehouseId,
          label: warehouseName || "My Warehouse",
          code: (warehouseName || "WH").slice(0, 3).toUpperCase(),
        },
      ]);
      if (selectedWarehouse !== warehouseId) {
        onChange(warehouseId);
      }
    } else {
      // Admin view — fetch all active warehouses from API
      warehouseMgmtApi.getWarehouses().then((res) => {
        if (!isMounted) return;
        const items = res.data?.result || [];
        const formatted = items.map((w) => ({
          id: String(w._id || w.id),
          label: w.warehouseName || w.name || w.shopName || "Warehouse",
          code: (w.warehouseName || w.name || "WH").slice(0, 3).toUpperCase(),
        }));
        setWarehouseList([{ id: "all", label: "All Warehouses", code: "ALL" }, ...formatted]);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isWarehouseUser, warehouseId, warehouseName]);

  return (
    <div
      className={cn(
        "inline-flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
        <Building2 size={13} />
        <span>Location:</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {warehouseList.map((wh) => {
          const isSelected = selectedWarehouse === wh.id;
          return (
            <button
              key={wh.id}
              onClick={() => onChange(wh.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5",
                isSelected
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200/60 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isSelected ? "bg-primary animate-pulse" : "bg-slate-300",
                )}
              />
              <span>{wh.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseSelector;
