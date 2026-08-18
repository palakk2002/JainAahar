import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Badge from "@shared/components/ui/Badge";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { ArrowDownLeft, Plus, CheckCircle2, Clock, FileText, Calendar, Building2, Package } from "lucide-react";
import { toast } from "sonner";

export const StockInward = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history"); // pending | history

  // Form State
  const [formWarehouseId, setFormWarehouseId] = useState("wh-indore");
  const [formProductId, setFormProductId] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formSource, setFormSource] = useState("Manufacturer / Mill");
  const [formInvoice, setFormInvoice] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [showInwardForm, setShowInwardForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, prodRes, whRes] = await Promise.all([
        warehouseMgmtApi.getMovements(selectedWarehouse),
        warehouseMgmtApi.getProducts(),
        warehouseMgmtApi.getWarehouses(),
      ]);
      if (movRes.data.success) {
        setMovements(movRes.data.result.filter((m) => m.movementType === "Stock Inward"));
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.result);
        if (prodRes.data.result.length > 0 && !formProductId) {
          setFormProductId(prodRes.data.result[0].id);
        }
      }
      if (whRes.data.success) setWarehouses(whRes.data.result);
    } catch (err) {
      toast.error("Failed to load inward records");
    } finally {
      setLoading(false);
    }
  };

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === formProductId);
    const selWh = warehouses.find((w) => w.id === formWarehouseId);
    if (!selProd || !selWh) return;

    try {
      await warehouseMgmtApi.createInward({
        warehouseId: formWarehouseId,
        warehouseName: selWh.name,
        productId: formProductId,
        productName: selProd.name,
        sku: selProd.sku,
        quantity: Number(formQuantity),
        source: formSource,
        reference: formInvoice,
        notes: formNotes,
      });

      toast.success(`Received ${formQuantity} units of ${selProd.name} into ${selWh.name}`);
      setShowInwardForm(false);
      setFormQuantity("");
      setFormInvoice("");
      setFormNotes("");
      fetchData();
    } catch (err) {
      toast.error("Failed to record inward entry");
    }
  };

  const selectedProductObj = products.find((p) => p.id === formProductId);

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
    {
      header: "Inward Qty",
      cell: (row) => (
        <span className="font-black text-emerald-600 text-xs">+{row.quantity}</span>
      ),
      align: "right",
    },
    {
      header: "Ref / Invoice",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-600">{row.reference}</span>
      ),
    },
    { header: "Received By", accessor: "user" },
    {
      header: "Status",
      cell: () => <Badge variant="success">Completed</Badge>,
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Inward"
        description="Receive physical inventory shipments from manufacturers, suppliers & transfers"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInwardForm(!showInwardForm)}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> New Inward Entry
            </button>
            <WarehouseSelector
              selectedWarehouse={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          </div>
        }
      />

      {/* Stock Inward Form (Collapsible/Modal) */}
      {showInwardForm && (
        <Card className="p-5 border-2 border-primary/20 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between border-b border-primary/10 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ArrowDownLeft size={18} className="text-primary" />
              New Stock Inward Entry Form
            </h3>
            <button
              onClick={() => setShowInwardForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Close Form
            </button>
          </div>

          <form onSubmit={handleInwardSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Destination Warehouse</label>
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

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Auto-Filled SKU</label>
              <input
                type="text"
                value={selectedProductObj?.sku || ""}
                disabled
                className="ds-input w-full font-mono bg-slate-100/70"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Inward Quantity</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="ds-input w-full font-bold"
                required
                min={1}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Source / Supplier</label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="ds-select w-full"
              >
                <option value="Manufacturer / Mill">Manufacturer / Mill Direct</option>
                <option value="Distributor Supplier">Distributor Supplier</option>
                <option value="Inter-Warehouse Transfer">Inter-Warehouse Transfer</option>
                <option value="Customer Return Restock">Customer Return Restock</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reference / Invoice No.</label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9910"
                value={formInvoice}
                onChange={(e) => setFormInvoice(e.target.value)}
                className="ds-input w-full font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Inward Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="ds-input w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Dock Receiving Notes</label>
              <input
                type="text"
                placeholder="Inspection notes, batch numbers..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="ds-input w-full"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setShowInwardForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
              >
                Submit Stock Receipt
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "history" ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Completed Inward History ({movements.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "pending" ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Pending Dock Arrivals (2)
        </button>
      </div>

      {activeTab === "history" ? (
        <Card className="p-5">
          <DataTable columns={columns} data={movements} />
        </Card>
      ) : (
        <Card className="p-5">
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Sharbati Wheat Atta 5kg — 500 Bags</span>
                <span className="text-[10px] text-slate-500 font-mono">Truck MP-09-AB-1234 • Expected Today 04:00 PM</span>
              </div>
              <Badge variant="warning">In Transit</Badge>
            </div>
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Desi Cow Ghee 1L — 100 Jars</span>
                <span className="text-[10px] text-slate-500 font-mono">Transfer TR-SVP-IND-03 • Expected Tomorrow</span>
              </div>
              <Badge variant="warning">Expected</Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StockInward;
