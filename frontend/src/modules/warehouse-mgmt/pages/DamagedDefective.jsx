import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import Badge from "@shared/components/ui/Badge";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { ShieldAlert, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const DamagedDefective = () => {
  const { isWarehouseUser, getActiveWarehouse } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("damaged"); // damaged | defective
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formWarehouseId, setFormWarehouseId] = useState(getActiveWarehouse("wh-indore"));
  const [formProductId, setFormProductId] = useState("");
  const [formType, setFormType] = useState("Damaged");
  const [formCategory, setFormCategory] = useState("Packaging Damage");
  const [formQuantity, setFormQuantity] = useState("");
  const [formReason, setFormReason] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const [dmgRes, prodRes, whRes] = await Promise.all([
        warehouseMgmtApi.getDamagedItems(activeWhId),
        warehouseMgmtApi.getProducts(),
        warehouseMgmtApi.getWarehouses(),
      ]);
      if (dmgRes.data.success) setItems(dmgRes.data.result);
      if (prodRes.data.success) {
        setProducts(prodRes.data.result);
        if (prodRes.data.result.length > 0 && !formProductId) {
          setFormProductId(prodRes.data.result[0].id);
        }
      }
      if (whRes.data.success) setWarehouses(whRes.data.result);
    } catch (err) {
      toast.error("Failed to load damaged & defective records");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const selProd = products.find((p) => p.id === formProductId);
    const selWh = warehouses.find((w) => w.id === formWarehouseId);

    try {
      await warehouseMgmtApi.addDamagedItem({
        warehouseId: formWarehouseId,
        warehouseName: selWh?.name || formWarehouseId,
        productId: formProductId,
        productName: selProd?.name || "",
        sku: selProd?.sku || "",
        type: formType,
        category: formCategory,
        quantity: Number(formQuantity),
        reason: formReason || `${formCategory} reported`,
        reportedBy: "Inspector",
      });

      toast.success(`Reported ${formQuantity} ${formType} items (Frontend simulation)`);
      setShowAddModal(false);
      setFormQuantity("");
      setFormReason("");
      fetchData();
    } catch (err) {
      toast.error("Failed to submit entry");
    }
  };

  const filteredItems = items.filter(
    (i) => i.type.toLowerCase() === activeTab.toLowerCase()
  );

  const columns = [
    {
      header: "Reported Date",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {new Date(row.reportedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
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
      header: "Category",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {row.category}
        </span>
      ),
    },
    {
      header: "Quantity",
      cell: (row) => <span className="font-black text-rose-600">{row.quantity}</span>,
      align: "center",
    },
    { header: "Reason / Detail", accessor: "reason" },
    { header: "Reported By", accessor: "reportedBy" },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "Quarantined" ? "warning" : "error"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Damaged & Defective Stock"
        description="Physical damage quarantine, defect reports & write-off tracking"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Report Damaged/Defective
            </button>
            <WarehouseSelector
              selectedWarehouse={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("damaged")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === "damaged" ? "bg-rose-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          <ShieldAlert size={16} />
          Damaged Items ({items.filter((i) => i.type === "Damaged").length})
        </button>
        <button
          onClick={() => setActiveTab("defective")}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === "defective" ? "bg-rose-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          <AlertTriangle size={16} />
          Defective Items ({items.filter((i) => i.type === "Defective").length})
        </button>
      </div>

      <Card className="p-5">
        <DataTable columns={columns} data={filteredItems} />
      </Card>

      {/* Report Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Report Damaged or Defective Stock"
          size="md"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => {
                    setFormType(e.target.value);
                    setFormCategory(
                      e.target.value === "Damaged" ? "Packaging Damage" : "Manufacturing Defect"
                    );
                  }}
                  className="ds-select w-full"
                >
                  <option value="Damaged">Damaged Stock</option>
                  <option value="Defective">Defective Stock</option>
                </select>
              </div>

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
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category / Reason</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="ds-select w-full"
              >
                {formType === "Damaged" ? (
                  <>
                    <option value="Broken">Broken Packaging</option>
                    <option value="Packaging Damage">Packaging Damage</option>
                    <option value="Physical Damage">Physical Crush/Spill Damage</option>
                  </>
                ) : (
                  <>
                    <option value="Manufacturing Defect">Manufacturing Defect</option>
                    <option value="Not Working">Not Working / Spoiled</option>
                    <option value="Missing Parts">Missing Parts / Quality Failure</option>
                  </>
                )}
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
              <label className="text-xs font-bold text-slate-700 block mb-1">Quantity</label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="ds-input w-full font-bold"
                required
                min={1}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Description</label>
              <textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Inspection notes & exact damage details..."
                className="ds-textarea w-full"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Submit Report
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DamagedDefective;
