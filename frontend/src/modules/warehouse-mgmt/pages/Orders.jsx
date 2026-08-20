import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Badge from "@shared/components/ui/Badge";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import FulfillmentStatusBadge from "../components/FulfillmentStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { ShoppingBag, Eye, MapPin, Truck, CheckCircle2, Package, ArrowRight, ShieldCheck, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Orders = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [selectedWarehouse]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await warehouseMgmtApi.getOrders(selectedWarehouse);
      if (res.data.success) setOrders(res.data.result);
    } catch (err) {
      toast.error("Failed to load warehouse orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await warehouseMgmtApi.updateFulfillmentStatus(orderId, newStatus);
      toast.success(`Order #${orderId} marked as ${newStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, fulfillmentStatus: newStatus });
      }
    } catch (err) {
      toast.error("Failed to update fulfillment status");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || o.fulfillmentStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "Order ID",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.id}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(row.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      header: "Customer & Destination",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.customerName}</span>
          <span className="text-[10px] text-slate-500 font-medium">{row.city}, {row.pincode} ({row.distanceKm} km away)</span>
        </div>
      ),
    },
    {
      header: "Assigned Warehouse",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {row.warehouseName?.replace(" Warehouse", "")}
        </span>
      ),
    },
    {
      header: "Products Count",
      cell: (row) => (
        <span className="text-xs font-bold text-slate-700">
          {row.items?.length || 0} SKUs ({row.items?.reduce((sum, i) => sum + i.qty, 0)} units)
        </span>
      ),
      align: "center",
    },
    {
      header: "Order Value",
      cell: (row) => <span className="font-black text-slate-900">₹{row.totalAmount}</span>,
      align: "right",
    },
    {
      header: "Fulfillment Status",
      cell: (row) => <FulfillmentStatusBadge status={row.fulfillmentStatus} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors flex items-center gap-1"
        >
          <Eye size={13} /> View Detail
        </button>
      ),
      align: "right",
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Warehouse Orders & Fulfillment"
        description="Customer order assignment, stock reservation & fulfillment workflow"
        actions={
          <WarehouseSelector
            selectedWarehouse={selectedWarehouse}
            onChange={setSelectedWarehouse}
          />
        }
      />

      <Card className="p-5 space-y-4">
        <FilterBar
          left={
            <>
              <input
                type="text"
                placeholder="Search order ID, customer or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ds-input w-64"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ds-select"
              >
                <option value="all">All Fulfillment Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="picking">Picking</option>
                <option value="packed">Packed</option>
                <option value="ready for shipment">Ready for Shipment</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
              </select>
            </>
          }
        />

        <DataTable columns={columns} data={filteredOrders} />
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.id} Fulfillment Detail`}
          size="lg"
        >
          <div className="space-y-5 pt-2">
            {/* Customer & Warehouse Fulfillment Header Flow */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Warehouse</span>
                  <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Building2 size={15} className="text-primary" />
                    {selectedOrder.warehouseName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location Serviceability</span>
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck size={14} /> Serviceable ({selectedOrder.distanceKm} km)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Customer Delivery Address:</span>
                  <strong className="text-slate-900 block font-bold">{selectedOrder.customerName} ({selectedOrder.customerPhone})</strong>
                  <span className="text-slate-600">{selectedOrder.customerAddress}, {selectedOrder.city} - {selectedOrder.pincode}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block">Shiprocket Courier & Tracking:</span>
                  <p className="font-mono text-slate-900 font-bold">AWB: {selectedOrder.awbNumber}</p>
                  <span className="text-slate-600 font-medium">Courier: {selectedOrder.courierName}</span>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Ordered Products & Picking Status</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                    <tr>
                      <th className="p-2.5 text-left">Product</th>
                      <th className="p-2.5 text-center">Required Qty</th>
                      <th className="p-2.5 text-center">Picked Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-slate-900">
                          {item.name}
                          <span className="block text-[10px] font-mono text-slate-400">{item.sku}</span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-900">{item.qty}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{item.pickedQty}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          ₹{(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons to Transition Fulfillment Status */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Advance Fulfillment Stage:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "Picking")}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100"
                >
                  Start Picking
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "Packed")}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100"
                >
                  Mark Packed
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "Ready for Shipment")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100"
                >
                  Ready for Shipment
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "Shipped")}
                  className="px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 font-bold text-xs hover:bg-cyan-100"
                >
                  Mark Shipped
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
