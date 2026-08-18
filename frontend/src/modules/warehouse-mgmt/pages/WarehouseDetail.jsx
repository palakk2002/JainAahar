import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import StatCard from "@shared/components/ui/StatCard";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Badge from "@shared/components/ui/Badge";
import Loader from "@shared/components/ui/Loader";
import StockStatusBadge from "../components/StockStatusBadge";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Truck,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Search,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export const WarehouseDetail = () => {
  const { warehouseId } = useParams();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchDetail();
  }, [warehouseId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [whRes, invRes] = await Promise.all([
        warehouseMgmtApi.getWarehouseById(warehouseId),
        warehouseMgmtApi.getInventory(warehouseId),
      ]);
      if (whRes.data.success) setWarehouse(whRes.data.result);
      if (invRes.data.success) setInventory(invRes.data.result);
    } catch (err) {
      toast.error("Failed to load warehouse detail");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;
  if (!warehouse) return <div className="p-8 text-center text-slate-500">Warehouse not found</div>;

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
    { header: "Category", accessor: "category" },
    {
      header: "Available",
      cell: (row) => <span className="font-bold text-emerald-700">{row.available}</span>,
      align: "right",
    },
    { header: "Reserved", accessor: "reserved", align: "right" },
    { header: "Damaged", accessor: "damaged", align: "right" },
    { header: "Min Stock", accessor: "minStock", align: "right" },
    {
      header: "Status",
      cell: (row) => <StockStatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/warehouse-mgmt/warehouses")}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <PageHeader
          title={warehouse.name}
          description={`${warehouse.city}, ${warehouse.state} • ${warehouse.code}`}
        />
      </div>

      {/* Warehouse Overview Card */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Address & Contact</h3>
            <p className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
              <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              {warehouse.address}
            </p>
            <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
              <Phone size={14} className="text-slate-400" />
              Manager: {warehouse.managerName} ({warehouse.phone})
            </p>
            <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
              <Mail size={14} className="text-slate-400" />
              {warehouse.email}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Shiprocket & Location Specs</h3>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Pickup Location:</span>
                <span className="font-mono font-bold text-slate-900">{warehouse.shiprocketPickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Geo Coordinates:</span>
                <span className="font-mono font-bold text-slate-900">{warehouse.lat}, {warehouse.lng}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Operating Hours:</span>
                <span className="font-bold text-slate-900">{warehouse.operatingHours}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Facility Capacity</h3>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Storage Area:</span>
                <span className="font-bold text-slate-900">{warehouse.capacitySqFt?.toLocaleString()} sq. ft.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Dock Loading Doors:</span>
                <span className="font-bold text-slate-900">{warehouse.dockDoors} Bay Doors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Status:</span>
                <Badge variant="success">ACTIVE OPERATIONAL</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 8 Key Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="SKUs" value={warehouse.totalSkus} icon={Package} bg="bg-indigo-50" color="text-indigo-600" />
        <StatCard label="Total Units" value={warehouse.totalStockUnits?.toLocaleString()} icon={Layers} bg="bg-blue-50" color="text-blue-600" />
        <StatCard label="Available" value={warehouse.availableStock?.toLocaleString()} icon={CheckCircle2} bg="bg-emerald-50" color="text-emerald-600" />
        <StatCard label="Reserved" value={warehouse.reservedStock?.toLocaleString()} icon={Clock} bg="bg-sky-50" color="text-sky-600" />
        <StatCard label="Damaged" value={warehouse.damagedStock} icon={ShieldAlert} bg="bg-orange-50" color="text-orange-600" />
        <StatCard label="Defective" value={warehouse.defectiveStock} icon={ShieldAlert} bg="bg-red-50" color="text-red-600" />
        <StatCard label="Low Stock" value={warehouse.lowStockCount} icon={AlertTriangle} bg="bg-amber-50" color="text-amber-600" />
        <StatCard label="Out of Stock" value={warehouse.outOfStockCount} icon={XCircle} bg="bg-rose-50" color="text-rose-600" />
      </div>

      {/* Warehouse Inventory Section */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">Warehouse Specific Products</h3>
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="ds-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="in stock">In Stock</option>
                  <option value="low stock">Low Stock</option>
                  <option value="out of stock">Out of Stock</option>
                </select>
              </>
            }
          />
        </div>

        <DataTable columns={columns} data={filteredInventory} />
      </Card>
    </div>
  );
};

export default WarehouseDetail;
