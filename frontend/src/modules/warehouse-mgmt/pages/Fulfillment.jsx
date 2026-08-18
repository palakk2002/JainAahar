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

  const handleShiprocketCreate = async (orderId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken") || localStorage.getItem("warehouseToken");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000/api";
      const res = await fetch(`${API_URL}/delivery/shipment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ orderId, preferredProvider: "shiprocket" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Shiprocket AWB #${data.result?.externalId || "Generated"} Created Successfully!`);
        fetchOrders();
      } else {
        toast.error(data.message || "Failed to create Shiprocket shipment");
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
      o.fulfillmentStatus === "Ready to Ship" ||
      o.fulfillmentStatus === "SHIPPED"
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
        description="Warehouse floor workflow: Accept → Pick → Pack → Ready to Ship"
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
          <CheckSquare size={16} />
          Picking Stage ({pickingOrders.length})
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
          Packing Stage ({packingOrders.length})
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
      </div>

      {/* 1. NEW ASSIGNED STAGE */}
      {activeTab === "assigned" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignedOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No new pending assignments for this warehouse.
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
                      Order: #{ord.orderId} • {ord.customerName} ({ord.customerCity || "Customer"})
                    </span>
                  </div>
                  <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>Items:</strong> {ord.items?.length || 0} SKU(s)</div>
                  <div><strong>Total Amount:</strong> ₹{ord.totalAmount || 0}</div>
                  <div><strong>Warehouse:</strong> {ord.warehouseName}</div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleAccept(ord.id)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Check size={14} /> Accept Fulfillment
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
              No orders currently in picking stage.
            </div>
          ) : (
            pickingOrders.map((ord) => {
              const allItemsPicked = (ord.items || []).every(
                (it) => it.pickedQty >= it.requiredQty
              );

              return (
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
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Picklist Items
                    </span>
                    {ord.items?.map((item) => (
                      <div
                        key={item.productId}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {item.sku}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-slate-600">
                              Req: <strong className="text-slate-900">{item.requiredQty || item.qty}</strong>
                            </span>
                            <span className="text-emerald-700">
                              Picked: <strong className="text-emerald-900">{item.pickedQty || 0}</strong>
                            </span>
                          </div>
                        </div>

                        {(item.pickedQty || 0) >= (item.requiredQty || item.qty) ? (
                          <Badge variant="success" className="flex items-center gap-1 text-[11px]">
                            <Check size={12} /> Picked
                          </Badge>
                        ) : (
                          <button
                            onClick={() =>
                              handlePickItem(ord.id, item.productId, item.requiredQty || item.qty)
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                          >
                            Pick All
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    {ord.fulfillmentStatus === "ACCEPTED" || ord.fulfillmentStatus === "Accepted" ? (
                      <button
                        onClick={() => handleStartPicking(ord.id)}
                        className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                      >
                        <Play size={14} /> Start Picking
                      </button>
                    ) : allItemsPicked ? (
                      <button
                        onClick={() => handleStartPacking(ord.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                      >
                        <PackageCheck size={14} /> Move to Packing Station
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
                      Order #{ord.orderId} • {ord.customerName}
                    </span>
                  </div>
                  <FulfillmentStatusBadge status={ord.fulfillmentStatus} />
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 text-xs space-y-1.5 text-emerald-900">
                  <div className="flex justify-between">
                    <span className="font-semibold">Fulfillment State:</span>
                    <span className="font-bold">Ready for Dispatch / Pickup</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Stock Status:</span>
                    <span className="font-bold text-emerald-700">Committed & Deducted</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => handleShiprocketCreate(ord.orderId || ord.id)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Truck size={14} /> Ship via Shiprocket (Generate AWB)
                  </button>
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
