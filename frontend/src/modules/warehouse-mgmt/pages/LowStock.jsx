import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import StockStatusBadge from "../components/StockStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { AlertTriangle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const LowStock = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await warehouseMgmtApi.getInventory(selectedWarehouse);
      if (res.data.success) {
        // Filter items where status is Low Stock or Out of Stock or available <= minStock
        const low = res.data.result.filter(
          (item) => item.status === "Low Stock" || item.available <= item.minStock
        );
        setInventory(low);
      }
    } catch (err) {
      toast.error("Failed to load low stock inventory");
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
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
      header: "Current Stock",
      cell: (row) => (
        <span className="font-black text-rose-600 text-xs">{row.available}</span>
      ),
      align: "right",
    },
    { header: "Min Threshold", accessor: "minStock", align: "right" },
    {
      header: "Deficit Difference",
      cell: (row) => (
        <span className="font-bold text-amber-700">
          {row.available - row.minStock} units
        </span>
      ),
      align: "center",
    },
    {
      header: "Status",
      cell: (row) => <StockStatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => navigate(`/warehouse-mgmt/inward`)}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Plus size={13} /> Stock Inward
          </button>
          <button
            onClick={() => navigate(`/warehouse-mgmt/transfers`)}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
          >
            Transfer In
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
        title="Low Stock Alerts"
        description="Products currently below configured minimum stock threshold"
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
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ds-input w-64"
            />
          }
        />

        <DataTable columns={columns} data={filteredInventory} />
      </Card>
    </div>
  );
};

export default LowStock;
