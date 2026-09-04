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
  Truck,
  PlusCircle,
  MapPin,
  Phone,
  Mail,
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

export const WarehouseDashboard = () => {
  const { isWarehouseUser, getActiveWarehouse, warehouseName, basePath, user } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(() => getActiveWarehouse("all"));
  const [stats, setStats] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const activeWhId = getActiveWarehouse(selectedWarehouse);
        const [statsRes, whRes, alertsRes] = await Promise.all([
          warehouseMgmtApi.getDashboardStats(activeWhId),
          isWarehouseUser ? Promise.resolve({ data: { success: true, result: [] } }) : warehouseMgmtApi.getWarehouses(),
          warehouseMgmtApi.getAlerts(activeWhId),
        ]);
        if (statsRes.data?.success) setStats(statsRes.data.result);
        if (whRes.data?.success) setWarehouses(whRes.data.result);
        if (alertsRes.data?.success) {
          let filteredAlerts = alertsRes.data.result;
          if (isWarehouseUser && activeWhId) {
            filteredAlerts = filteredAlerts.filter(a => !a.warehouseId || a.warehouseId === activeWhId);
          }
          setAlerts(filteredAlerts);
        }
      } catch (err) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedWarehouse, isWarehouseUser]);

  if (loading) {
    return (
      <div className="h-[75vh] flex items-center justify-center">
        <Loader fullScreen={false} />
      </div>
    );
  }

  // Stock status pie data
  const pieData = [
    { name: "Available Stock", value: stats?.availableStock || 0, color: "#10b981" },
    { name: "Reserved Stock", value: stats?.reservedStock || 0, color: "#0284c7" },
    { name: "Damaged Stock", value: stats?.damagedStock || 0, color: "#f59e0b" },
    { name: "Defective Stock", value: stats?.defectiveStock || 0, color: "#ef4444" },
  ];

  const trendData = stats?.trendData && stats.trendData.length > 0
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
        title={isWarehouseUser ? `${warehouseName || "Warehouse"} Dashboard` : "Warehouse Operations Dashboard"}
        description={
          isWarehouseUser
            ? "Your warehouse inventory, fulfillment orders & dispatch hub"
            : "Physical stock inventory, multi-warehouse comparison & operational analytics"
        }
        actions={
          !isWarehouseUser ? (
            <WarehouseSelector
              selectedWarehouse={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          ) : (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-orange-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>📍 {warehouseName} ({user?.city || "Hub"})</span>
            </div>
          )
        }
      />

      {/* Warehouse Manager Dedicated Overview Card */}
      {isWarehouseUser && (
        <Card className="p-4 sm:p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-orange-200/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="text-orange-600" size={20} />
                <h2 className="text-lg font-bold text-slate-900">{warehouseName}</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Active Hub
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                {user?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    {user.address}, {user.city} ({user.pincode})
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    {user.phone}
                  </span>
                )}
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`${basePath}/inward`)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                <PlusCircle size={14} /> Stock Inward
              </button>
              <button
                onClick={() => navigate(`${basePath}/fulfillment`)}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                <Truck size={14} /> Picking & Packing
              </button>
              <button
                onClick={() => navigate(`${basePath}/inventory`)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                <Package size={14} /> View Inventory
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Summary KPI Cards */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isWarehouseUser ? "lg:grid-cols-5" : "lg:grid-cols-6"} gap-3`}>
        {!isWarehouseUser && (
          <StatCard
            label="Warehouses"
            value={stats?.totalWarehouses}
            icon={Building2}
            color="text-primary"
            bg="bg-primary/10"
            onClick={() => navigate(`${basePath}/warehouses`)}
          />
        )}
        <StatCard
          label="Total SKUs"
          value={stats?.totalSkus}
          icon={Package}
          color="text-indigo-600"
          bg="bg-indigo-50"
          onClick={() => navigate(`${basePath}/inventory`)}
        />
        <StatCard
          label="Stock Units"
          value={stats?.totalStockUnits?.toLocaleString()}
          icon={Layers}
          color="text-blue-600"
          bg="bg-blue-50"
          onClick={() => navigate(`${basePath}/inventory`)}
        />
        <StatCard
          label="Available"
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
        <StatCard
          label="Pending Orders"
          value={stats?.pendingFulfillmentOrders}
          icon={ShoppingBag}
          color="text-cyan-600"
          bg="bg-cyan-50"
          onClick={() => navigate(`${basePath}/orders`)}
        />
      </div>

      {/* Warehouse Comparison Card (Admin only) */}
      {!isWarehouseUser && warehouses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            Warehouse Comparison
          </h2>
          <WarehouseComparisonCard warehouses={warehouses} />
        </div>
      )}

      {/* Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart: Stock Movement Trend */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Stock Movement Trend</h3>
              <p className="text-xs text-slate-500">Inward vs Outward stock comparison over 7 days</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              Weekly View
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="inward" name="Inward Units" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="outward" name="Outward Units" stroke="#0284c7" fill="#0284c7" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart: Stock Distribution */}
        <Card className="p-5">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Stock Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of inventory physical status</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
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

      {/* Operational Alerts Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Operational Alerts</h3>
          </div>
          <button
            onClick={() => navigate(`${basePath}/low-stock`)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View All Alerts <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 col-span-2">No critical stock alerts for this warehouse.</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(alert.actionUrl?.replace(/^\/warehouse-mgmt/, basePath) || `${basePath}/low-stock`)}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all cursor-pointer flex items-start gap-3 shadow-2xs"
              >
                <div className={`p-2 rounded-lg ${alert.severity === "critical" || alert.severity === "High" ? "bg-rose-100 text-rose-600" : alert.severity === "warning" || alert.severity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-600"}`}>
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{alert.title || alert.type}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alert.message}</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1.5 block">
                    {alert.warehouseName || warehouseName} • {new Date(alert.date || alert.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

export default WarehouseDashboard;

