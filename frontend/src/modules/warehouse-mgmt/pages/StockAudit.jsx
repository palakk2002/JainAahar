import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import MovementTypeBadge from "../components/MovementTypeBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { Search, History } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export const StockAudit = () => {
  const [searchParams] = useSearchParams();
  const initialSku = searchParams.get("sku") || "";

  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSku);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchMovements();
  }, [selectedWarehouse]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await warehouseMgmtApi.getMovements(selectedWarehouse);
      if (res.data.success) setMovements(res.data.result);
    } catch (err) {
      toast.error("Failed to load movement audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "all" || m.movementType.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      header: "Date & Time",
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-900 block">
            {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <span className="text-[10px] text-slate-400">
            {new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
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
      header: "Warehouse",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.warehouseName?.replace(" Warehouse", "")}</span>
      ),
    },
    {
      header: "Movement Type",
      cell: (row) => <MovementTypeBadge type={row.movementType} />,
    },
    {
      header: "Qty Change",
      cell: (row) => (
        <span className={`font-black text-xs ${row.quantity < 0 ? "text-rose-600" : "text-emerald-600"}`}>
          {row.quantity >= 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
      align: "right",
    },
    { header: "Before", accessor: "beforeQty", align: "right" },
    {
      header: "After",
      cell: (row) => <span className="font-bold text-slate-900">{row.afterQty}</span>,
      align: "right",
    },
    {
      header: "Reference",
      cell: (row) => <span className="font-mono text-xs text-slate-700 font-semibold">{row.reference}</span>,
    },
    { header: "User", accessor: "user" },
    { header: "Reason", accessor: "reason" },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Audit & Movement History"
        description="Immutable audit trail of all physical inventory movements & adjustments"
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
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search SKU, product or ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ds-input pl-9 w-64"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="ds-select"
              >
                <option value="all">All Movement Types</option>
                <option value="stock inward">Stock Inward</option>
                <option value="customer order">Customer Order</option>
                <option value="transfer">Transfer</option>
                <option value="return">Return</option>
                <option value="damaged">Damaged</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </>
          }
        />

        <DataTable columns={columns} data={filteredMovements} />
      </Card>
    </div>
  );
};

export default StockAudit;
