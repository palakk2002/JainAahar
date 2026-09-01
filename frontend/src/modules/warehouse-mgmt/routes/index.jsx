import React, { useEffect, useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@shared/layout/DashboardLayout";
import { setActiveRole, ROLES } from "@core/auth/activeRoleStore";
import { useAuth } from "@core/context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Box,
  ArrowRightLeft,
  Truck,
  AlertTriangle,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";

// Lazy Load Warehouse Mgmt Pages
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const Warehouses = React.lazy(() => import("../pages/Warehouses"));
const WarehouseDetail = React.lazy(() => import("../pages/WarehouseDetail"));
const Inventory = React.lazy(() => import("../pages/Inventory"));
const StockInward = React.lazy(() => import("../pages/StockInward"));
const StockOutward = React.lazy(() => import("../pages/StockOutward"));
const Orders = React.lazy(() => import("../pages/Orders"));
const Fulfillment = React.lazy(() => import("../pages/Fulfillment"));
const Transfers = React.lazy(() => import("../pages/Transfers"));
const DamagedDefective = React.lazy(() => import("../pages/DamagedDefective"));
const Returns = React.lazy(() => import("../pages/Returns"));
const StockAdjustments = React.lazy(() => import("../pages/StockAdjustments"));
const StockAudit = React.lazy(() => import("../pages/StockAudit"));
const LowStock = React.lazy(() => import("../pages/LowStock"));
const OutOfStock = React.lazy(() => import("../pages/OutOfStock"));
const Reports = React.lazy(() => import("../pages/Reports"));

const navItems = [
  {
    label: "Dashboard",
    path: "/warehouse-mgmt/dashboard",
    icon: LayoutDashboard,
    color: "indigo",
    end: true,
  },
  {
    label: "Warehouses",
    path: "/warehouse-mgmt/warehouses",
    icon: Building2,
    color: "teal",
  },
  {
    label: "Inventory",
    path: "/warehouse-mgmt/inventory",
    icon: Box,
    color: "amber",
  },
  {
    label: "Stock In / Out",
    icon: ArrowRightLeft,
    color: "emerald",
    children: [
      { label: "Stock Inward", path: "/warehouse-mgmt/inward" },
      { label: "Stock Outward", path: "/warehouse-mgmt/outward" },
    ],
  },
  {
    label: "Fulfillment",
    icon: Truck,
    color: "blue",
    children: [
      { label: "Warehouse Orders", path: "/warehouse-mgmt/orders" },
      { label: "Picking & Packing", path: "/warehouse-mgmt/fulfillment" },
    ],
  },
  {
    label: "Stock Transfers",
    path: "/warehouse-mgmt/transfers",
    icon: ArrowRightLeft,
    color: "violet",
  },
  {
    label: "Stock Exceptions",
    icon: AlertTriangle,
    color: "rose",
    children: [
      { label: "Damaged & Defective", path: "/warehouse-mgmt/damaged" },
      { label: "Returned Items", path: "/warehouse-mgmt/returns" },
      { label: "Stock Adjustments", path: "/warehouse-mgmt/adjustments" },
    ],
  },
  {
    label: "Audit & Reports",
    icon: ClipboardList,
    color: "slate",
    children: [
      { label: "Movement History", path: "/warehouse-mgmt/audit" },
      { label: "Low Stock Alerts", path: "/warehouse-mgmt/low-stock" },
      { label: "Out of Stock Items", path: "/warehouse-mgmt/out-of-stock" },
      { label: "Operational Reports", path: "/warehouse-mgmt/reports" },
    ],
  },
];

const WarehouseMgmtRoutes = () => {
  const { user, authData, role } = useAuth();
  const isAdmin = role === "admin" || user?.role === "admin" || Boolean(authData?.admin);

  useEffect(() => {
    setActiveRole(ROLES.WAREHOUSE);
  }, []);

  const effectiveNavItems = useMemo(() => {
    if (!isAdmin) return navItems;
    return [
      {
        label: "Back to Admin Center",
        path: "/admin",
        icon: ArrowLeft,
        color: "indigo",
      },
      ...navItems,
    ];
  }, [isAdmin]);

  return (
    <DashboardLayout navItems={effectiveNavItems} title="Warehouse Operations">
      <Routes>
        <Route path="/" element={<Navigate to="/warehouse-mgmt/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/warehouses" element={<Warehouses />} />
        <Route path="/warehouses/:warehouseId" element={<WarehouseDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inward" element={<StockInward />} />
        <Route path="/outward" element={<StockOutward />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/fulfillment" element={<Fulfillment />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/damaged" element={<DamagedDefective />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/adjustments" element={<StockAdjustments />} />
        <Route path="/audit" element={<StockAudit />} />
        <Route path="/low-stock" element={<LowStock />} />
        <Route path="/out-of-stock" element={<OutOfStock />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/warehouse-mgmt/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default WarehouseMgmtRoutes;
