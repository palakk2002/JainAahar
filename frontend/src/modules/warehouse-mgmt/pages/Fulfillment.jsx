import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import FulfillmentStatusBadge from "../components/FulfillmentStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { CheckSquare, PackageCheck, Truck, ShoppingBag, Check, Clock } from "lucide-react";
import { toast } from "sonner";

export const Fulfillment = () => {
  const { isWarehouseUser, getActiveWarehouse } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("picking"); // picking | packing

  useEffect(() => {
    fetchOrders();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const res = await warehouseMgmtApi.getOrders(activeWhId);
      if (res.data.success) setOrders(res.data.result);
    } catch (err) {
      toast.error("Failed to load fulfillment orders");
    } finally {
      setLoading(false);
    }
  };

  const handlePickItem = async (orderId, productId, requiredQty) => {
    try {
      await warehouseMgmtApi.updateItemPicking(orderId, productId, requiredQty);
      toast.success("Item picked successfully");
      fetchOrders();
    } catch (err) {
      toast.error("Failed to update item pick");
    }
  };

  const handleMarkPacked = async (orderId) => {
    try {
      await warehouseMgmtApi.updateFulfillmentStatus(orderId, "Packed");
      toast.success(`Order #${orderId} packed and ready for shipping!`);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to mark packed");
    }
  };

  const pickingOrders = orders.filter(
    (o) => o.fulfillmentStatus === "Picking" || o.fulfillmentStatus === "Confirmed"
  );
  const packingOrders = orders.filter(
    (o) => o.fulfillmentStatus === "Picking" || o.fulfillmentStatus === "Packed"
  );

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Picking & Packing Station"
        description="Warehouse floor operations for order item picking & packing verification"
        actions={
          <WarehouseSelector
            selectedWarehouse={selectedWarehouse}
            onChange={setSelectedWarehouse}
          />
        }
      />

      {/* Primary Operation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("picking")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === "picking" ? "bg-primary text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          <CheckSquare size={16} />
          Picking Stage ({pickingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === "packing" ? "bg-primary text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          <PackageCheck size={16} />
          Packing Stage ({packingOrders.length})
        </button>
      </div>

      {activeTab === "picking" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pickingOrders.map((ord) => (
            <Card key={ord.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-sm">#{ord.id}</span>
                  <span className="text-xs text-slate-500 font-medium block">
                    {ord.customerName} • {ord.warehouseName?.replace(" Warehouse", "")}
                  </span>
                </div>
                <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Items Picklist</span>
                {ord.items?.map((item) => (
                  <div key={item.productId} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-slate-600">Required: <strong className="text-slate-900">{item.qty}</strong></span>
                        <span className="text-emerald-700">Picked: <strong className="text-emerald-900">{item.pickedQty}</strong></span>
                      </div>
                    </div>

                    {item.pickedQty >= item.qty ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Check size={12} /> Picked
                      </Badge>
                    ) : (
                      <button
                        onClick={() => handlePickItem(ord.id, item.productId, item.qty)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        Confirm Pick
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {packingOrders.map((ord) => (
            <Card key={ord.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-sm">#{ord.id}</span>
                  <span className="text-xs text-slate-500 font-medium block">
                    Customer: {ord.customerName} ({ord.city})
                  </span>
                </div>
                <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Courier Assigned:</span>
                  <span className="font-bold text-slate-900">{ord.courierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Shiprocket AWB:</span>
                  <span className="font-mono font-bold text-slate-900">{ord.awbNumber}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                {ord.fulfillmentStatus === "Packed" ? (
                  <Badge variant="success" className="text-xs py-1 px-3">
                    Order Packed & Ready for Shiprocket Pickup
                  </Badge>
                ) : (
                  <button
                    onClick={() => handleMarkPacked(ord.id)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <PackageCheck size={15} /> Complete Packing & Mark Ready
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Fulfillment;
