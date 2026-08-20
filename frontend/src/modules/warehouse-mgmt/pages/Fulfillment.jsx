import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import FulfillmentStatusBadge from "../components/FulfillmentStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import {
  CheckSquare,
  PackageCheck,
  Truck,
  ShoppingBag,
  Check,
  Clock,
  Play,
  AlertTriangle,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export const Fulfillment = () => {
  const { isWarehouseUser, getActiveWarehouse } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assigned"); // assigned | picking | packing | ready

  useEffect(() => {
    fetchOrders();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const res = await warehouseMgmtApi.getOrders(activeWhId);
      if (res.data?.success) {
        setOrders(res.data.result || []);
      }
    } catch (err) {
      toast.error("Failed to load fulfillment orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (fulfillmentId) => {
    try {
      const res = await warehouseMgmtApi.updateFulfillmentStatus(fulfillmentId, "accept");
      if (res.data?.success) {
        toast.success("Order accepted for fulfillment");
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to accept order");
      }
    } catch (err) {
      toast.error("Failed to accept order");
    }
  };

  const handleStartPicking = async (fulfillmentId) => {
    try {
      const res = await warehouseMgmtApi.updateFulfillmentStatus(fulfillmentId, "start-picking");
      if (res.data?.success) {
        toast.success("Picking started");
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to start picking");
      }
    } catch (err) {
      toast.error("Failed to start picking");
    }
  };

  const handlePickItem = async (fulfillmentId, productId, requiredQty) => {
    try {
      const res = await warehouseMgmtApi.updateItemPicking(fulfillmentId, productId, requiredQty, 0);
      if (res.data?.success) {
        toast.success("Item picked successfully");
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to update item pick");
      }
    } catch (err) {
      toast.error("Failed to update item pick");
    }
  };

  const handleStartPacking = async (fulfillmentId) => {
    try {
      const res = await warehouseMgmtApi.updateFulfillmentStatus(fulfillmentId, "start-packing");
      if (res.data?.success) {
        toast.success("Packing station started");
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to start packing");
      }
    } catch (err) {
      toast.error("Failed to start packing");
    }
  };

  const handleMarkPacked = async (fulfillmentId) => {
    try {
      const res = await warehouseMgmtApi.updateFulfillmentStatus(fulfillmentId, "packed");
      if (res.data?.success) {
        toast.success("Order packed successfully!");
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to mark packed");
      }
    } catch (err) {
      toast.error("Failed to mark packed");
    }
  };

  const handleMarkReadyToShip = async (fulfillmentId) => {
    try {
      const res = await warehouseMgmtApi.updateFulfillmentStatus(fulfillmentId, "ready-to-ship");
      if (res.data?.success) {
        toast.success("Fulfillment marked Ready to Ship! Stock committed.");
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to mark ready to ship");
      }
    } catch (err) {
      toast.error("Failed to mark ready to ship");
    }
  };

  const handleMarkShipped = async (fulfillmentId, awbCode = "") => {
    try {
      const res = await warehouseMgmtApi.updateFulfillmentStatus(fulfillmentId, "mark-shipped", {
        awbCode,
      });
      if (res.data?.success !== false) {
        toast.success("Order marked as Dispatched / Shipped!");
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to mark shipped");
      }
    } catch (err) {
      toast.error("Failed to mark shipped");
    }
  };

  const handleShiprocketCreate = async (fulfillmentId) => {
    try {
      const res = await warehouseMgmtApi.updateFulfillmentStatus(fulfillmentId, "create-shipment");
      if (res.data?.success !== false) {
        toast.success(`Shiprocket AWB Generated: ${res.data?.result?.awbCode || "Success"}!`);
        fetchOrders();
      } else {
        toast.error(res.data?.message || "Failed to create Shiprocket shipment");
      }
    } catch (err) {
      toast.error("Failed to connect to Shiprocket service");
    }
  };

  // Groupings by stage
  const assignedOrders = orders.filter(
    (o) => o.fulfillmentStatus === "ASSIGNED" || o.fulfillmentStatus === "Assigned"
  );
  const pickingOrders = orders.filter(
    (o) =>
      o.fulfillmentStatus === "ACCEPTED" ||
      o.fulfillmentStatus === "PICKING" ||
      o.fulfillmentStatus === "Picking" ||
      o.fulfillmentStatus === "Accepted"
  );
  const packingOrders = orders.filter(
    (o) =>
      o.fulfillmentStatus === "PACKING" ||
      o.fulfillmentStatus === "PACKED" ||
      o.fulfillmentStatus === "Packing" ||
      o.fulfillmentStatus === "Packed"
  );
  const readyOrders = orders.filter(
    (o) =>
      o.fulfillmentStatus === "READY_TO_SHIP" ||
      o.fulfillmentStatus === "Ready to Ship"
  );
  const shippedOrders = orders.filter(
    (o) =>
      o.fulfillmentStatus === "SHIPPED" ||
      o.fulfillmentStatus === "Shipped" ||
      o.fulfillmentStatus === "COMPLETED" ||
      o.fulfillmentStatus === "Completed"
  );

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fulfillment Station"
        description="Warehouse floor workflow: Accept → Pick → Pack → Ready to Ship → Shiprocket Dispatch"
        actions={
          <WarehouseSelector
            selectedWarehouse={selectedWarehouse}
            onChange={setSelectedWarehouse}
          />
        }
      />

      {/* Primary Operation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "assigned"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock size={16} />
          New Assigned ({assignedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("picking")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "picking"
              ? "bg-primary text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Play size={16} />
          Picking ({pickingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "packing"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <PackageCheck size={16} />
          Packing ({packingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("ready")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "ready"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Send size={16} />
          Ready to Ship ({readyOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("shipped")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === "shipped"
              ? "bg-purple-600 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Truck size={16} />
          Shipped & In-Transit ({shippedOrders.length})
        </button>
      </div>

      {/* 1. ASSIGNED STAGE */}
      {activeTab === "assigned" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignedOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No new unaccepted orders assigned to this warehouse.
            </div>
          ) : (
            assignedOrders.map((ord) => (
              <Card key={ord.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{ord.fulfillmentId || ord.orderId}
                    </span>
                    <span className="text-xs text-slate-500 font-medium block">
                      Order #{ord.orderId} • {ord.customerName}
                    </span>
                  </div>
                  <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Items to Fulfill ({ord.items?.length || 0})
                  </span>
                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{it.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            SKU: {it.sku || "N/A"}
                          </span>
                        </div>
                        <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {it.qty || it.requiredQty} units
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => handleAccept(ord.id)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <CheckSquare size={14} /> Accept for Floor Picking
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 2. PICKING STAGE */}
      {activeTab === "picking" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pickingOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No orders currently in floor picking.
            </div>
          ) : (
            pickingOrders.map((ord) => {
              const allPicked = ord.items?.every(
                (i) => (i.pickedQty || 0) >= (i.requiredQty || 1)
              );

              return (
                <Card key={ord.id} className="p-5 space-y-4 border-l-4 border-l-primary">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        #{ord.fulfillmentId || ord.orderId}
                      </span>
                      <span className="text-xs text-slate-500 font-medium block">
                        Order #{ord.orderId} • {ord.customerName}
                      </span>
                    </div>
                    <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Pick List Checklist</span>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                      {ord.items?.map((it, idx) => {
                        const isItemDone = (it.pickedQty || 0) >= (it.requiredQty || 1);
                        return (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className={`font-bold ${isItemDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                                {it.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                SKU: {it.sku || "N/A"} • Needed: {it.requiredQty}
                              </span>
                            </div>
                            <div>
                              {isItemDone ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                                  <Check size={13} /> {it.pickedQty} Picked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handlePickItem(ord.id, it.productId, it.requiredQty)}
                                  className="px-3 py-1 rounded-lg bg-primary text-white font-bold text-[11px] hover:bg-primary/90 shadow-xs"
                                >
                                  Verify Pick ({it.requiredQty})
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    {allPicked ? (
                      <button
                        onClick={() => handleStartPacking(ord.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                      >
                        <PackageCheck size={14} /> Send to Packing Station
                      </button>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold py-1">
                        Pick all items to proceed to packing
                      </span>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* 3. PACKING STAGE */}
      {activeTab === "packing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {packingOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No orders currently in packing stage.
            </div>
          ) : (
            packingOrders.map((ord) => (
              <Card key={ord.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{ord.fulfillmentId || ord.orderId}
                    </span>
                    <span className="text-xs text-slate-500 font-medium block">
                      Order #{ord.orderId} • {ord.customerName}
                    </span>
                  </div>
                  <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Total Items:</span>
                    <span className="font-bold text-slate-900">{ord.items?.length || 0} verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Status:</span>
                    <span className="font-bold text-indigo-600">{ord.fulfillmentStatus}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  {ord.fulfillmentStatus === "PACKED" || ord.fulfillmentStatus === "Packed" ? (
                    <button
                      onClick={() => handleMarkReadyToShip(ord.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                    >
                      <Send size={14} /> Mark Ready to Ship & Commit Stock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkPacked(ord.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                    >
                      <PackageCheck size={14} /> Complete Packing & Seal Box
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 4. READY TO SHIP STAGE */}
      {activeTab === "ready" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {readyOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No orders waiting for courier pickup.
            </div>
          ) : (
            readyOrders.map((ord) => (
              <Card key={ord.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{ord.fulfillmentId || ord.orderId}
                    </span>
                    <span className="text-xs text-slate-500 font-medium block">
                      Order #{ord.orderId} • {ord.customerName} • {ord.customerCity || "City"}
                    </span>
                  </div>
                  <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 text-xs space-y-2 text-emerald-950">
                  <div className="flex justify-between">
                    <span className="font-semibold text-emerald-800">Fulfillment State:</span>
                    <span className="font-bold">Ready for Dispatch / Pickup</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-emerald-800">Stock Status:</span>
                    <span className="font-bold text-emerald-700">Committed & Deducted</span>
                  </div>

                  {ord.awbCode ? (
                    <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                      <span className="font-semibold text-purple-900">Shiprocket AWB:</span>
                      <a
                        href={ord.trackingUrl || `https://shiprocket.co/tracking/${ord.awbCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-purple-700 hover:text-purple-900 underline text-xs flex items-center gap-1"
                      >
                        #{ord.awbCode} ↗
                      </a>
                    </div>
                  ) : (
                    <div className="pt-1.5 border-t border-emerald-200 text-amber-700 font-medium">
                      ⚠️ AWB generation pending (use button below to generate via Shiprocket)
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2 flex-wrap">
                  {!ord.awbCode ? (
                    <button
                      onClick={() => handleShiprocketCreate(ord.id)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <Truck size={14} /> Generate Shiprocket AWB
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleMarkShipped(ord.id, ord.awbCode)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Send size={14} /> Handover to Courier (Mark Shipped)
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 5. SHIPPED & DISPATCHED STAGE */}
      {activeTab === "shipped" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {shippedOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No orders currently in-transit or dispatched.
            </div>
          ) : (
            shippedOrders.map((ord) => (
              <Card key={ord.id} className="p-5 space-y-4 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      #{ord.fulfillmentId || ord.orderId}
                    </span>
                    <span className="text-xs text-slate-500 font-medium block">
                      Order #{ord.orderId} • {ord.customerName}
                    </span>
                  </div>
                  <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
                </div>

                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs space-y-2 text-purple-950">
                  <div className="flex justify-between">
                    <span className="font-semibold text-purple-700">Courier Provider:</span>
                    <span className="font-bold">{ord.courierName || "Shiprocket Delivery"}</span>
                  </div>
                  {ord.awbCode && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-purple-700">AWB Tracking Code:</span>
                      <a
                        href={ord.trackingUrl || `https://shiprocket.co/tracking/${ord.awbCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-purple-900 underline flex items-center gap-1"
                      >
                        #{ord.awbCode} ↗
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Fulfillment;
