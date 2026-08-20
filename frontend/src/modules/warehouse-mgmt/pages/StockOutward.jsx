import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Badge from "@shared/components/ui/Badge";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import MovementTypeBadge from "../components/MovementTypeBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { ArrowUpRight, Search } from "lucide-react";
import { toast } from "sonner";

export const StockOutward = () => {
  const { isWarehouseUser, getActiveWarehouse } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");

  useEffect(() => {
    fetchMovements();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const res = await warehouseMgmtApi.getMovements(activeWhId);
      if (res.data?.success) {
        // Filter outward movements (where quantity < 0 or movementType is OUTWARD / Customer Order / Transfer Out / Fulfillment)
        const outward = (res.data.result || []).filter(
          (m) =>
            m.quantity < 0 ||
            m.movementType === "OUTWARD" ||
            m.movementType === "Stock Outward" ||
            m.movementType === "Customer Order" ||
            m.movementType === "FULFILLMENT" ||
            m.movementType === "TRANSFER_OUT",
        );
        setMovements(outward);
      }
    } catch (err) {
      toast.error("Failed to load outward records");
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesReason =
      reasonFilter === "all" || m.movementType.toLowerCase() === reasonFilter.toLowerCase();
    return matchesSearch && matchesReason;
  });

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
      header: "Outward Qty",
      cell: (row) => (
        <span className="font-black text-rose-600 text-xs">{row.quantity}</span>
      ),
      align: "right",
    },
    {
      header: "Warehouse",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.warehouseName?.replace(" Warehouse", "")}</span>
      ),
    },
    {
      header: "Movement Reason",
      cell: (row) => <MovementTypeBadge type={row.movementType} />,
    },
    {
      header: "Ref Number",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700">{row.reference}</span>
      ),
    },
    { header: "Dispatched By / User", accessor: "user" },
    {
      header: "Status",
      cell: () => <Badge variant="info">Dispatched</Badge>,
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Outward"
        description="Physical inventory dispatched for customer orders, transfers & approved movements"
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
                  placeholder="Search product, SKU or order ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ds-input pl-9 w-64"
                />
              </div>

              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="ds-select"
              >
                <option value="all">All Movement Reasons</option>
                <option value="customer order">Customer Order</option>
                <option value="transfer">Inter-Warehouse Transfer</option>
                <option value="damaged">Damaged Outward</option>
                <option value="adjustment">Stock Adjustment</option>
              </select>
            </>
          }
        />

        <DataTable columns={columns} data={filteredMovements} />
      </Card>
    </div>
  );
};

export default StockOutward;
