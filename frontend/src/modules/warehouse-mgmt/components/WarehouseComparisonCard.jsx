import React from "react";
import Card from "@shared/components/ui/Card";
import { Building2, Package, CheckCircle2, AlertTriangle, XCircle, ShoppingBag, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const WarehouseComparisonCard = ({ warehouses = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {warehouses.map((wh) => (
        <Card key={wh.id} className="p-5 relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{wh.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{wh.city}, {wh.state} ({wh.pincode})</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/warehouse-mgmt/dashboard?warehouse=${wh.id}`)}
                className="text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
              >
                Open Dashboard
              </button>
              <button
                onClick={() => navigate(`/warehouse-mgmt/warehouses/${wh.id}`)}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Details
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Package size={11} className="text-slate-400" /> Total Stock
              </span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">
                {wh.totalStockUnits?.toLocaleString()}
              </span>
            </div>

            <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-600" /> Available
              </span>
              <span className="text-lg font-black text-emerald-900 block mt-0.5">
                {wh.availableStock?.toLocaleString()}
              </span>
            </div>

            <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <AlertTriangle size={11} className="text-amber-600" /> Low Stock
              </span>
              <span className="text-lg font-black text-amber-900 block mt-0.5">
                {wh.lowStockCount} SKUs
              </span>
            </div>

            <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <XCircle size={11} className="text-rose-600" /> Out of Stock
              </span>
              <span className="text-lg font-black text-rose-900 block mt-0.5">
                {wh.outOfStockCount} SKUs
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-primary" />
              Pending Orders: <strong className="text-slate-900 font-bold">{wh.pendingOrdersCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-indigo-600" />
              Pending Transfers: <strong className="text-slate-900 font-bold">{wh.pendingTransfersCount}</strong>
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default WarehouseComparisonCard;
