import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import StatCard from "@shared/components/ui/StatCard";
import Card from "@shared/components/ui/Card";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import WarehouseComparisonCard from "../components/WarehouseComparisonCard";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import {
  Building2,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRightLeft,
  RotateCcw,
  ShoppingBag,
  Bell,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const NetworkOverview = () => {
  const { basePath } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [stats, setStats] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, whRes, alertsRes] = await Promise.all([
          warehouseMgmtApi.getDashboardStats(selectedWarehouse),
          warehouseMgmtApi.getWarehouses(),
          warehouseMgmtApi.getAlerts(selectedWarehouse),
        ]);
        if (statsRes.data?.success) setStats(statsRes.data.result);
        if (whRes.data?.success) setWarehouses(whRes.data.result);
        if (alertsRes.data?.success) setAlerts(alertsRes.data.result);
      } catch (err) {
        toast.error("Failed to load consolidated warehouse data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedWarehouse]);

  if (loading) {
    return (
      <div className="h-[75vh] flex items-center justify-center">
        <Loader fullScreen={false} />
      </div>
    );
  }

  const pieData = [
    { name: "Available Stock", value: stats?.availableStock || 0, color: "#10b981" },
    { name: "Reserved Stock", value: stats?.reservedStock || 0, color: "#0284c7" },
    { name: "Damaged Stock", value: stats?.damagedStock || 0, color: "#f59e0b" },
    { name: "Defective Stock", value: stats?.defectiveStock || 0, color: "#ef4444" },
  ];

  const trendData =
    stats?.trendData && stats.trendData.length > 0
      ? stats.trendData
      : [
          { day: "Mon", inward: 0, outward: 0 },
          { day: "Tue", inward: 0, outward: 0 },
          { day: "Wed", inward: 0, outward: 0 },
          { day: "Thu", inward: 0, outward: 0 },
          { day: "Fri", inward: 0, outward: 0 },
          { day: "Sat", inward: 0, outward: 0 },
          { day: "Sun", inward: 0, outward: 0 },
        ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Network Overview"
        description="Consolidated physical stock inventory, multi-hub comparison & enterprise-wide logistics analytics"
        actions={
          <WarehouseSelector
            selectedWarehouse={selectedWarehouse}
            onChange={setSelectedWarehouse}
            showAllOption={true}
          />
        }
      />

      {/* Network High-level KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Warehouses"
          value={stats?.totalWarehouses || warehouses.length}
          icon={Building2}
          color="text-primary"
          bg="bg-primary/10"
          onClick={() => navigate(`${basePath}/warehouses`)}
        />
        <StatCard
          label="Network SKUs"
          value={stats?.totalSkus}
          icon={Package}
          color="text-indigo-600"
          bg="bg-indigo-50"
          onClick={() => navigate(`${basePath}/inventory`)}
        />
        <StatCard
          label="Total Stock Units"
          value={stats?.totalStockUnits?.toLocaleString()}
          icon={Layers}
          color="text-blue-600"
          bg="bg-blue-50"
          onClick={() => navigate(`${basePath}/inventory`)}
        />
        <StatCard
          label="Total Available"
          value={stats?.availableStock?.toLocaleString()}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
          onClick={() => navigate(`${basePath}/inventory`)}
        />
        <StatCard
          label="Reserved Stock"
          value={stats?.reservedStock?.toLocaleString()}
          icon={Clock}
          color="text-sky-600"
          bg="bg-sky-50"
          onClick={() => navigate(`${basePath}/orders`)}
        />
        <StatCard
          label="Pending Orders"
          value={stats?.pendingFulfillmentOrders}
          icon={ShoppingBag}
          color="text-cyan-600"
          bg="bg-cyan-50"
          onClick={() => navigate(`${basePath}/orders`)}
        />
        <StatCard
          label="Low Stock Items"
          value={stats?.lowStockItems}
          icon={AlertTriangle}
          color="text-amber-600"
          bg="bg-amber-50"
          onClick={() => navigate(`${basePath}/low-stock`)}
        />
        <StatCard
          label="Out of Stock"
          value={stats?.outOfStockItems}
          icon={XCircle}
          color="text-rose-600"
          bg="bg-rose-50"
          onClick={() => navigate(`${basePath}/out-of-stock`)}
        />
        <StatCard
          label="Damaged Stock"
          value={stats?.damagedStock}
          icon={ShieldAlert}
          color="text-orange-600"
          bg="bg-orange-50"
          onClick={() => navigate(`${basePath}/damaged`)}
        />
        <StatCard
          label="Defective Stock"
          value={stats?.defectiveStock}
          icon={ShieldAlert}
          color="text-red-600"
          bg="bg-red-50"
          onClick={() => navigate(`${basePath}/damaged`)}
        />
        <StatCard
          label="Pending Transfers"
          value={stats?.pendingTransfers}
          icon={ArrowRightLeft}
          color="text-violet-600"
          bg="bg-violet-50"
          onClick={() => navigate(`${basePath}/transfers`)}
        />
        <StatCard
          label="Pending Returns"
          value={stats?.pendingReturns}
          icon={RotateCcw}
          color="text-pink-600"
          bg="bg-pink-50"
          onClick={() => navigate(`${basePath}/returns`)}
        />
      </div>

      {/* Side-by-side Warehouse Comparison */}
      {warehouses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              Physical Hub Comparison
            </h2>
            <button
              onClick={() => navigate(`${basePath}/warehouses`)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Manage Hubs <ArrowUpRight size={14} />
            </button>
          </div>
          <WarehouseComparisonCard warehouses={warehouses} />
        </div>
      )}

      {/* Network Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                Network Stock Movement Trend
              </h3>
              <p className="text-xs text-slate-500">Consolidated Inward vs Outward stock comparison across all hubs</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              7 Days View
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="inward"
                  name="Inward Units"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outward"
                  name="Outward Units"
                  stroke="#0284c7"
                  fill="#0284c7"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Network Stock Distribution</h3>
            <p className="text-xs text-slate-500">Aggregate physical status breakdown</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Network Alerts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Network Operational Alerts</h3>
          </div>
          <button
            onClick={() => navigate(`${basePath}/low-stock`)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View All Stock Alerts <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 col-span-2">No critical stock alerts across any warehouse.</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() =>
                  navigate(alert.actionUrl?.replace(/^\/warehouse-mgmt/, basePath) || `${basePath}/low-stock`)
                }
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all cursor-pointer flex items-start gap-3 shadow-2xs"
              >
                <div
                  className={`p-2 rounded-lg ${
                    alert.severity === "critical" || alert.severity === "High"
                      ? "bg-rose-100 text-rose-600"
                      : alert.severity === "warning" || alert.severity === "Medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{alert.title || alert.type}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alert.message}</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 block">
                    {alert.warehouseName || "All Hubs"} •{" "}
                    {new Date(alert.date || alert.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default NetworkOverview;
