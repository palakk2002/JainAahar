import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { Edit3, Plus } from "lucide-react";
import { toast } from "sonner";

export const StockAdjustments = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formWarehouseId, setFormWarehouseId] = useState("wh-indore");
  const [formProductId, setFormProductId] = useState("");
  const [systemQty, setSystemQty] = useState(100);
  const [physicalQty, setPhysicalQty] = useState(97);
  const [reason, setReason] = useState("Physical Count Difference");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adjRes, prodRes, whRes] = await Promise.all([
        warehouseMgmtApi.getAdjustments(selectedWarehouse),
        warehouseMgmtApi.getProducts(),
        warehouseMgmtApi.getWarehouses(),
      ]);
      if (adjRes.data.success) setAdjustments(adjRes.data.result);
      if (prodRes.data.success) {
        setProducts(prodRes.data.result);
        if (prodRes.data.result.length > 0 && !formProductId) {
          setFormProductId(prodRes.data.result[0].id);
        }
      }
      if (whRes.data.success) setWarehouses(whRes.data.result);
    } catch (err) {
      toast.error("Failed to load adjustments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === formProductId);
    const selWh = warehouses.find((w) => w.id === formWarehouseId);
    const diff = Number(physicalQty) - Number(systemQty);

    try {
      await warehouseMgmtApi.createAdjustment({
        warehouseId: formWarehouseId,
        warehouseName: selWh?.name || formWarehouseId,
        productId: formProductId,
        productName: selProd?.name || "",
        sku: selProd?.sku || "",
        systemQty: Number(systemQty),
        physicalQty: Number(physicalQty),
        adjustmentQty: diff,
        reason,
        notes,
      });

      toast.success(`Created stock adjustment of ${diff >= 0 ? "+" : ""}${diff} units`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to submit adjustment");
    }
  };

  const columns = [
    {
      header: "Date",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      header: "Adjustment ID",
      cell: (row) => <span className="font-mono font-bold text-slate-900 text-xs">{row.id}</span>,
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
      header: "Warehouse",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.warehouseName?.replace(" Warehouse", "")}</span>
      ),
    },
    { header: "System Qty", accessor: "systemQty", align: "center" },
    { header: "Physical Qty", accessor: "physicalQty", align: "center" },
    {
      header: "Variance",
      cell: (row) => (
        <span
          className={`font-black text-xs ${row.adjustmentQty < 0 ? "text-rose-600" : "text-emerald-600"}`}
        >
          {row.adjustmentQty >= 0 ? `+${row.adjustmentQty}` : row.adjustmentQty}
        </span>
      ),
      align: "center",
    },
    { header: "Reason", accessor: "reason" },
    { header: "Audit User", accessor: "user" },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Adjustments"
        description="Reconcile physical stock counts with system inventory levels"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> New Adjustment
            </button>
            <WarehouseSelector
              selectedWarehouse={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          </div>
        }
      />

      <Card className="p-5">
        <DataTable columns={columns} data={adjustments} />
      </Card>

      {/* Adjustment Form Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Stock Adjustment Entry"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Warehouse</label>
                <select
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(e.target.value)}
                  className="ds-select w-full"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Current System Quantity</label>
                <input
                  type="number"
                  value={systemQty}
                  onChange={(e) => setSystemQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="ds-input w-full font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Physical Counted Quantity</label>
                <input
                  type="number"
                  value={physicalQty}
                  onChange={(e) => setPhysicalQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="ds-input w-full font-bold text-primary"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <span>Calculated Variance: </span>
              <strong className={Number(physicalQty) - Number(systemQty) < 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                {Number(physicalQty) - Number(systemQty) >= 0 ? "+" : ""}{Number(physicalQty) - Number(systemQty)} units
              </strong>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Adjustment Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="ds-select w-full"
              >
                <option value="Physical Count Difference">Physical Count Difference</option>
                <option value="Damaged Found">Damaged Found</option>
                <option value="Missing Stock">Missing Stock</option>
                <option value="Data Correction">Data Correction</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Audit Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason explanation for audit record..."
                className="ds-textarea w-full"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90"
              >
                Submit Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StockAdjustments;
