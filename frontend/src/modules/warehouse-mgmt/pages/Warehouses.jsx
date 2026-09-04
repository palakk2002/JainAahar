import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import Badge from "@shared/components/ui/Badge";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { Building2, Eye, Edit3, Package, MapPin, Phone, Mail, Truck, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWh, setEditingWh] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await warehouseMgmtApi.getWarehouses();
      if (res.data.success) setWarehouses(res.data.result);
    } catch (err) {
      toast.error("Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingWh) return;
    try {
      await warehouseMgmtApi.updateWarehouse(editingWh.id, editingWh);
      toast.success("Warehouse updated (Frontend state)");
      setEditingWh(null);
      fetchWarehouses();
    } catch (err) {
      toast.error("Failed to save changes");
    }
  };

  const columns = [
    {
      header: "Warehouse",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Building2 size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">{row.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-700 block">{row.city}, {row.state}</span>
          <span className="text-[10px] text-slate-400">PIN: {row.pincode}</span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "success" : "gray"}>
          {row.status?.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: "Total SKUs",
      accessor: "totalSkus",
      align: "center",
    },
    {
      header: "Available Stock",
      cell: (row) => (
        <span className="font-bold text-emerald-700">
          {row.availableStock?.toLocaleString()}
        </span>
      ),
      align: "right",
    },
    {
      header: "Pending Orders",
      cell: (row) => (
        <span className="font-bold text-amber-700">
          {row.pendingOrdersCount}
        </span>
      ),
      align: "center",
    },
    {
      header: "Shiprocket Pickup",
      cell: (row) => (
        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
          {row.shiprocketPickupLocation}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/warehouse-mgmt/dashboard?warehouse=${row.id}`)}
            className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 text-xs font-bold transition-colors flex items-center gap-1"
            title="Open Hub Operations Dashboard"
          >
            <LayoutDashboard size={13} /> Dashboard
          </button>
          <button
            onClick={() => navigate(`/warehouse-mgmt/warehouses/${row.id}`)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => setEditingWh(row)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Edit Details"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => navigate(`/warehouse-mgmt/inventory?warehouse=${row.id}`)}
            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Package size={13} /> Stock
          </button>
        </div>
      ),
      align: "right",
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Physical Warehouses"
        description="Indore and Shivpuri inventory fulfillment centers"
      />

      <Card className="p-5">
        <DataTable columns={columns} data={warehouses} />
      </Card>

      {/* Edit Warehouse Modal */}
      {editingWh && (
        <Modal
          isOpen={Boolean(editingWh)}
          onClose={() => setEditingWh(null)}
          title={`Edit ${editingWh.name}`}
          size="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Warehouse Name</label>
              <input
                type="text"
                value={editingWh.name}
                onChange={(e) => setEditingWh({ ...editingWh, name: e.target.value })}
                className="ds-input w-full"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={editingWh.city}
                  onChange={(e) => setEditingWh({ ...editingWh, city: e.target.value })}
                  className="ds-input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={editingWh.pincode}
                  onChange={(e) => setEditingWh({ ...editingWh, pincode: e.target.value })}
                  className="ds-input w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Address</label>
              <textarea
                value={editingWh.address}
                onChange={(e) => setEditingWh({ ...editingWh, address: e.target.value })}
                className="ds-textarea w-full"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Shiprocket Pickup Location ID</label>
              <input
                type="text"
                value={editingWh.shiprocketPickupLocation}
                onChange={(e) => setEditingWh({ ...editingWh, shiprocketPickupLocation: e.target.value })}
                className="ds-input w-full font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingWh(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Warehouses;
