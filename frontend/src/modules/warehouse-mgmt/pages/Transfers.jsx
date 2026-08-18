import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import TransferStatusBadge from "../components/TransferStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { ArrowRightLeft, Plus, CheckCircle2, Truck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Transfers = () => {
  const { isWarehouseUser, getActiveWarehouse, warehouseId } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form State
  const [sourceWhId, setSourceWhId] = useState("");
  const [destWhId, setDestWhId] = useState("");
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

      if (trRes.data?.success) setTransfers(trRes.data.result || []);
      if (prodRes.data?.success) {
        const prodList = prodRes.data.result || [];
        setProducts(prodList);
        if (prodList.length > 0 && !formProductId) {
          setFormProductId(prodList[0]._id || prodList[0].id);
        }
      }
      if (whRes.data?.success) {
        const whList = whRes.data.result || [];
        setWarehouses(whList);
        if (whList.length >= 2) {
          setSourceWhId((prev) => prev || (isWarehouseUser && warehouseId ? warehouseId : whList[0]._id || whList[0].id));
          setDestWhId((prev) => prev || (whList[1]._id || whList[1].id));
        }
      }
    } catch (err) {
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!sourceWhId || !destWhId) {
      toast.error("Please select both source and destination warehouses");
      return;
    }
    if (sourceWhId === destWhId) {
      toast.error("Source and Destination warehouses must be different");
      return;
    }
    if (!formProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!formQuantity || Number(formQuantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const res = await warehouseMgmtApi.createTransfer({
        sourceWarehouseId: sourceWhId,
        destWarehouseId: destWhId,
        items: [
          {
            productId: formProductId,
            quantity: Number(formQuantity),
          },
        ],
        reason: formReason,
        notes: formNotes,
      });

      if (res.data?.success) {
        toast.success("Transfer request created successfully");
        setShowTransferModal(false);
        setFormQuantity("");
        setFormNotes("");
        fetchData();
      } else {
        toast.error(res.data?.message || "Failed to create transfer");
      }
    } catch (err) {
      toast.error("Failed to create transfer");
    }
  };

  const handleUpdateStatus = async (id, action) => {
    try {
      const res = await warehouseMgmtApi.updateTransferStatus(id, action);
      if (res.data?.success) {
        toast.success(`Transfer updated successfully`);
        fetchData();
      } else {
        toast.error(res.data?.message || "Failed to update transfer");
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const columns = [
    {
      header: "Transfer ID",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">
            {row.transferId || row.id}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(row.requestDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: "Route",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-slate-700">{row.sourceWarehouseName}</span>
          <ArrowRight size={13} className="text-slate-400" />
          <span className="text-primary">{row.destWarehouseName}</span>
        </div>
      ),
    },
    {
      header: "Item Details",
      cell: (row) => {
        const item = row.items?.[0];
        return (
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">{item?.productName || "Product"}</span>
            <span className="text-[10px] text-slate-500">
              Qty: <strong className="text-slate-800">{item?.quantity || row.quantity || 0}</strong> • SKU: {item?.sku || row.sku || "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (row) => <TransferStatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          {(row.status === "REQUESTED" || row.status === "Requested") && (
            <button
              onClick={() => handleUpdateStatus(row.id || row._id, "approve")}
              className="px-2.5 py-1 rounded-lg bg-info/10 text-primary font-bold text-xs hover:bg-primary/20"
            >
              Approve & Dispatch
            </button>
          )}
          {(row.status === "IN_TRANSIT" || row.status === "In Transit" || row.status === "APPROVED") && (
            <button
              onClick={() => handleUpdateStatus(row.id || row._id, "receive")}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100"
            >
              Confirm Receipt
            </button>
          )}
          {row.status !== "RECEIVED" && row.status !== "CANCELLED" && (
            <button
              onClick={() => handleUpdateStatus(row.id || row._id, "cancel")}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100"
            >
              Cancel
            </button>
          )}
        </div>
      ),
      align: "right",
    },
  ];

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
        title="Stock Transfers"
        description="Inter-warehouse stock balancing and inventory relocation"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  disabled={isWarehouseUser}
                >
                  {warehouses.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.warehouseName || w.name || "Warehouse"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Destination Warehouse</label>
                <select
                  value={destWhId}
                  onChange={(e) => setDestWhId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  {warehouses
                    .filter((w) => String(w._id || w.id) !== String(sourceWhId))
                    .map((w) => (
                      <option key={w._id || w.id} value={w._id || w.id}>
                        {w.warehouseName || w.name || "Warehouse"}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Product</label>
              <select
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                {products.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name || p.title} (SKU: {p.sku || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Reason for transfer"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Optional notes or instructions"
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 shadow-sm"
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
