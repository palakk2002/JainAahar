import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import Badge from "@shared/components/ui/Badge";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import MovementTypeBadge from "../components/MovementTypeBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { ArrowDownLeft, Plus, Truck, Package, Inbox, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const StockInward = () => {
  const { isWarehouseUser, getActiveWarehouse, warehouseId } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [movements, setMovements] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("history"); // pending | history

  // Form State
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isManualProduct, setIsManualProduct] = useState(false);
  const [manualProductName, setManualProductName] = useState("");
  const [manualSku, setManualSku] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formDamagedQty, setFormDamagedQty] = useState("");
  const [formDefectiveQty, setFormDefectiveQty] = useState("");
  const [formSource, setFormSource] = useState("Manufacturer / Mill");
  const [formInvoice, setFormInvoice] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [showInwardForm, setShowInwardForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const [movRes, prodRes, whRes, trRes] = await Promise.all([
        warehouseMgmtApi.getMovements(activeWhId),
        warehouseMgmtApi.getProducts(),
        warehouseMgmtApi.getWarehouses(),
        warehouseMgmtApi.getTransfers(activeWhId),
      ]);

      if (movRes.data?.success) {
        const rawMovs = movRes.data.result || [];
        const inwardMovs = rawMovs.filter(
          (m) =>
            m.movementType === "INWARD" ||
            m.movementType === "Stock Inward" ||
            String(m.movementType).toUpperCase() === "INWARD",
        );
        setMovements(inwardMovs);
      }

      if (prodRes.data?.success) {
        const prodList = prodRes.data.result || [];
        setProducts(prodList);
        if (prodList.length > 0 && !formProductId) {
          setFormProductId(String(prodList[0]._id || prodList[0].id));
        }
      }

      if (whRes.data?.success) {
        const whList = whRes.data.result || [];
        setWarehouses(whList);
        if (whList.length > 0) {
          const defaultWh = isWarehouseUser && warehouseId ? warehouseId : String(whList[0]._id || whList[0].id);
          setFormWarehouseId((prev) => prev || defaultWh);
        }
      }

      if (trRes.data?.success) {
        const transfers = trRes.data.result || [];
        const incoming = transfers.filter((t) => {
          const isDest =
            selectedWarehouse === "all" ||
            String(t.destWarehouseId) === String(activeWhId);
          return isDest && (t.status === "IN_TRANSIT" || t.status === "APPROVED" || t.status === "REQUESTED");
        });
        setPendingTransfers(incoming);
      }
    } catch (err) {
      toast.error("Failed to load inward records");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const term = productSearch.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(term) ||
      (p.sku || "").toLowerCase().includes(term)
    );
  });

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    const selWh = warehouses.find((w) => String(w._id || w.id) === String(formWarehouseId));
    if (!selWh) {
      toast.error("Please select a destination warehouse");
      return;
    }
    const totalQty = Number(formQuantity);
    const dmgQty = Number(formDamagedQty) || 0;
    const defQty = Number(formDefectiveQty) || 0;

    if (!formQuantity || totalQty <= 0) {
      toast.error("Please enter a valid quantity greater than 0");
      return;
    }

    if (dmgQty + defQty > totalQty) {
      toast.error(`Damaged (${dmgQty}) + Defective (${defQty}) cannot exceed Total Received (${totalQty})`);
      return;
    }

    let targetProductId = formProductId;
    let targetProductName = "";
    let targetSku = "";

    if (isManualProduct) {
      if (!manualProductName.trim()) {
        toast.error("Please enter the product name");
        return;
      }
      targetProductName = manualProductName.trim();
      targetSku = manualSku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`;
      // Find matching existing product by name/sku or use first as surrogate
      const match = products.find(
        (p) =>
          p.name.toLowerCase() === targetProductName.toLowerCase() ||
          (p.sku && p.sku.toLowerCase() === targetSku.toLowerCase()),
      );
      targetProductId = match ? String(match._id || match.id) : (products[0] ? String(products[0]._id || products[0].id) : formProductId);
    } else {
      const selProd = products.find((p) => String(p._id || p.id) === String(formProductId));
      if (!selProd) {
        toast.error("Please select a product from the list");
        return;
      }
      targetProductId = String(selProd._id || selProd.id);
      targetProductName = selProd.name || selProd.title || "Product";
      targetSku = selProd.sku || "";
    }

    setSubmitting(true);
    try {
      const payload = {
        warehouseId: String(selWh._id || selWh.id),
        warehouseName: selWh.warehouseName || selWh.name || "Warehouse",
        productId: targetProductId,
        productName: targetProductName,
        sku: targetSku,
        quantity: totalQty,
        damagedQty: dmgQty,
        defectiveQty: defQty,
        source: formSource,
        reference: formInvoice.trim() || `INW-${Date.now()}`,
        notes: formNotes ? `${formNotes} (Date: ${formDate})` : `Inward Date: ${formDate}`,
      };

      const res = await warehouseMgmtApi.createInward(payload);
      if (res.data?.success !== false) {
        const accepted = totalQty - dmgQty - defQty;
        toast.success(`Received ${totalQty} units (${accepted} usable, ${dmgQty} damaged, ${defQty} defective) of ${targetProductName} into ${selWh.warehouseName || selWh.name}`);
        setShowInwardForm(false);
        setFormQuantity("");
        setFormDamagedQty("");
        setFormDefectiveQty("");
        setFormInvoice("");
        setFormNotes("");
        setManualProductName("");
        setManualSku("");
        fetchData();
      } else {
        toast.error(res.data?.message || "Failed to record inward entry");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to record inward entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveTransfer = async (transfer) => {
    try {
      const res = await warehouseMgmtApi.updateTransferStatus(transfer.id || transfer._id, "receive");
      if (res.data?.success !== false) {
        toast.success(`Transfer ${transfer.transferId || transfer.transferNumber} received successfully!`);
        fetchData();
      } else {
        toast.error(res.data?.message || "Failed to receive transfer");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to receive transfer");
    }
  };

  const selectedProductObj = products.find((p) => String(p._id || p.id) === String(formProductId));

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

          {/* Entry Mode Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-white/80 p-2 rounded-xl border border-primary/10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsManualProduct(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isManualProduct ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                📦 Select from Catalog ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setIsManualProduct(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isManualProduct ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                ✍️ Enter Custom / Unlisted Item
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {isManualProduct ? "Manual entry for new physical stock shipment" : "Choose from pre-approved store products"}
            </span>
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
                {warehouses.length === 0 ? (
                  <option value="">No warehouses found</option>
                ) : (
                  warehouses.map((w) => (
                    <option key={w._id || w.id} value={String(w._id || w.id)}>
                      {w.warehouseName || w.name || w.shopName || "Warehouse"}
                    </option>
                  ))
                )}
              </select>
            </div>

            {!isManualProduct ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Product</label>
                    {products.length > 5 && (
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="text-[11px] px-2 py-0.5 border border-slate-200 rounded-md w-32 focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="ds-select w-full"
                    required
                  >
                    {filteredProducts.length === 0 ? (
                      <option value="">No matching products</option>
                    ) : (
                      filteredProducts.map((p) => (
                        <option key={p._id || p.id} value={String(p._id || p.id)}>
                          {p.name || p.title} {p.sku ? `(${p.sku})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Auto-Filled SKU</label>
                  <input
                    type="text"
                    value={selectedProductObj?.sku || "N/A"}
                    disabled
                    className="ds-input w-full font-mono bg-slate-100/70 text-slate-600"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Custom Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sharbati MP Wheat Flour 50kg"
                    value={manualProductName}
                    onChange={(e) => setManualProductName(e.target.value)}
                    className="ds-input w-full font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">SKU / Barcode (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-SHARB-50KG (Auto if blank)"
                    value={manualSku}
                    onChange={(e) => setManualSku(e.target.value)}
                    className="ds-input w-full font-mono"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Total Received Qty</label>
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
              <label className="text-xs font-bold text-amber-700 block mb-1">Damaged Qty (Quarantined)</label>
              <input
                type="number"
                placeholder="e.g. 5 (not sellable)"
                value={formDamagedQty}
                onChange={(e) => setFormDamagedQty(e.target.value)}
                className="ds-input w-full border-amber-200 focus:border-amber-500"
                min={0}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-red-700 block mb-1">Defective Qty (Quarantined)</label>
              <input
                type="number"
                placeholder="e.g. 0 (not sellable)"
                value={formDefectiveQty}
                onChange={(e) => setFormDefectiveQty(e.target.value)}
                className="ds-input w-full border-red-200 focus:border-red-500"
                min={0}
              />
            </div>

            {/* Live Calculation Preview */}
            {Number(formQuantity) > 0 && (
              <div className="md:col-span-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-slate-600">Total Received: <strong className="text-slate-900">{Number(formQuantity) || 0}</strong></span>
                  <span className="text-amber-700 font-medium">Damaged: <strong>{Number(formDamagedQty) || 0}</strong></span>
                  <span className="text-red-700 font-medium">Defective: <strong>{Number(formDefectiveQty) || 0}</strong></span>
                </div>
                <div className="text-emerald-800 font-bold text-sm bg-emerald-100/80 px-3 py-1 rounded-lg">
                  ✅ Usable Sellable Stock: {Math.max(0, (Number(formQuantity) || 0) - (Number(formDamagedQty) || 0) - (Number(formDefectiveQty) || 0))} units
                </div>
              </div>
            )}

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
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? "Processing..." : "Submit Stock Receipt"}
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
          Pending Dock Arrivals ({pendingTransfers.length})
        </button>
      </div>

      {activeTab === "history" ? (
        <Card className="p-5">
          {movements.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Inbox size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-600">No stock inward records found</p>
              <p className="text-xs text-slate-400 mt-1">Use the '+ New Inward Entry' button above to receive inventory.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={movements} />
          )}
        </Card>
      ) : (
        <Card className="p-5">
          {pendingTransfers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Truck size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-600">No pending dock arrivals</p>
              <p className="text-xs text-slate-400 mt-1">Incoming in-transit warehouse transfers and shipments will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTransfers.map((tr) => (
                <div
                  key={tr.id || tr._id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between flex-wrap gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {tr.items?.map((it) => `${it.productName || "Item"} (${it.quantity} Qty)`).join(", ") || "Stock Shipment"}
                      </span>
                      <Badge variant="warning">{tr.status}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      From: <span className="font-semibold text-slate-700">{tr.sourceWarehouseName}</span> → To: <span className="font-semibold text-slate-700">{tr.destWarehouseName}</span> • Ref: {tr.transferId || tr.transferNumber}
                    </div>
                  </div>
                  {tr.status === "IN_TRANSIT" && (
                    <button
                      onClick={() => handleReceiveTransfer(tr)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 size={13} /> Receive at Dock
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default StockInward;
