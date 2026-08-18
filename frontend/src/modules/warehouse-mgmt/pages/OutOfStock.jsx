import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import StockStatusBadge from "../components/StockStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { XCircle, Plus, ArrowRightLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const OutOfStock = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await warehouseMgmtApi.getInventory(selectedWarehouse);
      if (res.data.success) {
        // Filter zero available stock items
        const oos = res.data.result.filter(
          (item) => item.available === 0 || item.status === "Out of Stock"
        );
        setInventory(oos);
      }
    } catch (err) {
      toast.error("Failed to load out of stock items");
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(inventory.map((i) => i.category))).filter(Boolean);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
    { header: "Category", accessor: "category" },
    {
      header: "Warehouse",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.warehouseName?.replace(" Warehouse", "")}</span>
      ),
    },
    {
      header: "Available Stock",
      cell: () => <span className="font-black text-rose-600">0 Units</span>,
      align: "center",
    },
    { header: "In Transit Units", accessor: "inTransit", align: "center" },
    { header: "Min Threshold", accessor: "minStock", align: "right" },
    {
      header: "Status",
      cell: (row) => <StockStatusBadge status="Out of Stock" />,
    },
    {
      header: "Actions",
      cell: () => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => navigate("/warehouse-mgmt/inward")}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <Plus size={13} /> Stock Inward
          </button>
          <button
            onClick={() => navigate("/warehouse-mgmt/transfers")}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1"
          >
            <ArrowRightLeft size={13} /> Transfer In
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
        title="Out of Stock Inventory"
        description="Warehouse-wise items with zero available units requiring immediate replenishment"
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
              <input
                type="text"
                placeholder="Search product or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ds-input w-64"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="ds-select"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </>
          }
        />

        <DataTable columns={columns} data={filteredInventory} />
      </Card>
    </div>
  );
};

export default OutOfStock;
