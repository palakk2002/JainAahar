import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Pagination from "@shared/components/ui/Pagination";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import StockStatusBadge from "../components/StockStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { Search, SlidersHorizontal, History, Edit3, Eye } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export const Inventory = () => {
  const [searchParams] = useSearchParams();
  const initialWh = searchParams.get("warehouse") || "all";
  const { isWarehouseUser, getActiveWarehouse, warehouseName } = useWarehouseContext();

  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse(initialWh));
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Adjustment modal state
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [physicalQty, setPhysicalQty] = useState(0);
  const [adjReason, setAdjReason] = useState("Physical Count Difference");
  const [adjNotes, setAdjNotes] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const res = await warehouseMgmtApi.getInventory(activeWhId);
      if (res.data.success) setInventory(res.data.result);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjustment = (row) => {
    setAdjustingItem(row);
    setPhysicalQty(row.available);
    setAdjReason("Physical Count Difference");
    setAdjNotes("");
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustingItem) return;
    const diff = Number(physicalQty) - adjustingItem.available;

    try {
      await warehouseMgmtApi.createAdjustment({
        warehouseId: adjustingItem.warehouseId,
        warehouseName: adjustingItem.warehouseName,
        productId: adjustingItem.productId,
        productName: adjustingItem.productName,
        sku: adjustingItem.sku,
        systemQty: adjustingItem.available,
        physicalQty: Number(physicalQty),
        adjustmentQty: diff,
        reason: adjReason,
        notes: adjNotes,
      });

      toast.success(`Stock adjusted by ${diff >= 0 ? "+" : ""}${diff} units (Frontend state)`);
      setAdjustingItem(null);
      fetchInventory();
    } catch (err) {
      toast.error("Failed to apply adjustment");
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in_stock" && item.status === "In Stock") ||
      (stockFilter === "low_stock" && item.status === "Low Stock") ||
      (stockFilter === "out_of_stock" && item.status === "Out of Stock") ||
      (stockFilter === "damaged" && item.damaged > 0) ||
      (stockFilter === "defective" && item.defective > 0);

    return matchesSearch && matchesStock;
  });

  const totalPages = Math.ceil(filteredInventory.length / pageSize) || 1;
  const paginatedData = filteredInventory.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    {
      header: "Product",
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
        <span className="text-xs font-semibold text-slate-700">
          {row.warehouseName?.replace(" Warehouse", "")}
        </span>
      ),
    },
    {
      header: "Available",
      cell: (row) => (
        <span className="font-bold text-emerald-700 text-xs">{row.available}</span>
      ),
      align: "right",
    },
    { header: "Reserved", accessor: "reserved", align: "right" },
    { header: "Damaged", accessor: "damaged", align: "right" },
    { header: "Defective", accessor: "defective", align: "right" },
    { header: "Returned", accessor: "returned", align: "right" },
    { header: "In Transit", accessor: "inTransit", align: "right" },
    {
      header: "Total",
      cell: (row) => <span className="font-black text-slate-900">{row.total}</span>,
      align: "right",
    },
    { header: "Min Stock", accessor: "minStock", align: "right" },
    {
      header: "Status",
      cell: (row) => <StockStatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => navigate(`/warehouse-mgmt/audit?sku=${row.sku}`)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="View Movement History"
          >
            <History size={14} />
          </button>
          <button
            onClick={() => handleOpenAdjustment(row)}
            className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors flex items-center gap-1"
            title="Adjust Physical Stock"
          >
            <Edit3 size={13} /> Adjust
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
        title="Warehouse Inventory"
        description="Warehouse-wise stock availability, reserved units & thresholds"
        actions={
          !isWarehouseUser ? (
            <WarehouseSelector
              selectedWarehouse={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          ) : (
            <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              📍 {warehouseName}
            </span>
          )
        }
      />

      <Card className="p-5 space-y-4">
        <FilterBar
          left={
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search product or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ds-input pl-9 w-64"
                />
              </div>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="ds-select"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="damaged">Has Damaged Stock</option>
                <option value="defective">Has Defective Stock</option>
              </select>
            </>
          }
        />

        <DataTable columns={columns} data={paginatedData} />

        <Pagination
          page={page}
          totalPages={totalPages}
          total={filteredInventory.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <Modal
          isOpen={Boolean(adjustingItem)}
          onClose={() => setAdjustingItem(null)}
          title="Stock Adjustment"
          size="md"
        >
          <form onSubmit={handleSaveAdjustment} className="space-y-4 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">{adjustingItem.productName}</p>
              <p className="text-slate-500 font-mono">SKU: {adjustingItem.sku} • WH: {adjustingItem.warehouseName}</p>
              <p className="text-emerald-700 font-semibold">Current System Available: <strong>{adjustingItem.available} units</strong></p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Physical Counted Quantity</label>
              <input
                type="number"
                value={physicalQty}
                onChange={(e) => setPhysicalQty(e.target.value === "" ? "" : Number(e.target.value))}
                className="ds-input w-full font-mono text-base font-bold"
                required
              />
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                Calculated Variance: <strong className={Number(physicalQty) - adjustingItem.available < 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                  {Number(physicalQty) - adjustingItem.available >= 0 ? "+" : ""}{Number(physicalQty) - adjustingItem.available} units
                </strong>
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Adjustment Reason</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
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
                value={adjNotes}
                onChange={(e) => setAdjNotes(e.target.value)}
                placeholder="Reason details for log record..."
                className="ds-textarea w-full"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90"
              >
                Confirm Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;
