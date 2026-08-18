import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import TransferStatusBadge from "../components/TransferStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { ArrowRightLeft, Plus, CheckCircle2, Truck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Transfers = () => {
  const { isWarehouseUser, getActiveWarehouse } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form State
  const [sourceWhId, setSourceWhId] = useState(getActiveWarehouse("wh-indore"));
  const [destWhId, setDestWhId] = useState(
    getActiveWarehouse("wh-indore") === "wh-indore" ? "wh-shivpuri" : "wh-indore"
  );
  const [formProductId, setFormProductId] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formReason, setFormReason] = useState("Low Stock Balancing");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const [trRes, prodRes, whRes] = await Promise.all([
        warehouseMgmtApi.getTransfers(activeWhId),
        warehouseMgmtApi.getProducts(),
        warehouseMgmtApi.getWarehouses(),
      ]);
      if (trRes.data.success) setTransfers(trRes.data.result);
      if (prodRes.data.success) {
        setProducts(prodRes.data.result);
        if (prodRes.data.result.length > 0 && !formProductId) {
          setFormProductId(prodRes.data.result[0].id);
        }
      }
      if (whRes.data.success) setWarehouses(whRes.data.result);
    } catch (err) {
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (sourceWhId === destWhId) {
      toast.error("Source and Destination warehouses must be different");
      return;
    }
    const selProd = products.find((p) => p.id === formProductId);
    const sourceWh = warehouses.find((w) => w.id === sourceWhId);
    const destWh = warehouses.find((w) => w.id === destWhId);

    try {
      await warehouseMgmtApi.createTransfer({
        sourceWarehouseId: sourceWhId,
        sourceWarehouseName: sourceWh?.name || sourceWhId,
        destWarehouseId: destWhId,
        destWarehouseName: destWh?.name || destWhId,
        productId: formProductId,
        productName: selProd?.name || "",
        sku: selProd?.sku || "",
        quantity: Number(formQuantity),
        reason: formReason,
        notes: formNotes,
        requestedBy: "Warehouse Manager",
      });

      toast.success("Transfer request created (Frontend simulation)");
      setShowTransferModal(false);
      setFormQuantity("");
      setFormNotes("");
      fetchData();
    } catch (err) {
      toast.error("Failed to create transfer");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await warehouseMgmtApi.updateTransferStatus(id, status);
      toast.success(`Transfer status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const columns = [
    {
      header: "Transfer ID",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.transferNumber}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(row.requestDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          </span>
        </div>
      ),
    },
    {
      header: "Route (From → To)",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <span>{row.sourceWarehouseName?.replace(" Warehouse", "")}</span>
          <ArrowRight size={13} className="text-primary" />
          <span>{row.destWarehouseName?.replace(" Warehouse", "")}</span>
        </div>
      ),
    },
    {
      header: "Product & SKU",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{row.productName}</span>
          <span className="text-[10px] text-slate-400 font-mono font-semibold">{row.sku}</span>
        </div>
      ),
    },
    {
      header: "Qty",
      cell: (row) => <span className="font-black text-slate-900">{row.quantity}</span>,
      align: "center",
    },
    {
      header: "Status",
      cell: (row) => <TransferStatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          {row.status === "Requested" && (
            <button
              onClick={() => handleUpdateStatus(row.id, "Approved")}
              className="px-2.5 py-1 rounded-lg bg-info/10 text-primary font-bold text-xs hover:bg-primary/20"
            >
              Approve
            </button>
          )}
          {row.status === "Approved" && (
            <button
              onClick={() => handleUpdateStatus(row.id, "In Transit")}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100"
            >
              Dispatch
            </button>
          )}
          {row.status === "In Transit" && (
            <button
              onClick={() => handleUpdateStatus(row.id, "Received")}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100"
            >
              Receive
            </button>
          )}
        </div>
      ),
      align: "right",
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Transfers"
        description="Inter-warehouse stock balancing between Indore and Shivpuri hubs"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Request Stock Transfer
            </button>
            <WarehouseSelector
              selectedWarehouse={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          </div>
        }
      />

      <Card className="p-5 space-y-4">
        <DataTable columns={columns} data={transfers} />
      </Card>

      {/* Transfer Request Modal */}
      {showTransferModal && (
        <Modal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          title="Create Inter-Warehouse Stock Transfer"
          size="md"
        >
          <form onSubmit={handleCreateTransfer} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Source Warehouse</label>
                <select
                  value={sourceWhId}
                  onChange={(e) => setSourceWhId(e.target.value)}
                  className="ds-select w-full"
                  required
                  disabled={isWarehouseUser}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Destination Warehouse</label>
                <select
                  value={destWhId}
                  onChange={(e) => setDestWhId(e.target.value)}
                  className="ds-select w-full"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Product</label>
              <select
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="ds-select w-full"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Transfer Quantity</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="ds-input w-full font-bold"
                required
                min={1}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Transfer</label>
              <input
                type="text"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="ds-input w-full"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Transfer Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Driver details, vehicle number, batch notes..."
                className="ds-textarea w-full"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90"
              >
                Submit Transfer Request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Transfers;
