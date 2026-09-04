import React, { useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
const NetworkOverview = React.lazy(() => import("../pages/NetworkOverview"));
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
const PickupAddresses = React.lazy(() => import("../pages/PickupAddresses"));

const buildNavItems = (basePath, isWarehouseUser, isAdmin) => {
  return [
    ...(!isWarehouseUser && isAdmin
      ? [
          {
            label: "Consolidated Overview",
            path: `${basePath}/overview`,
            icon: LayoutDashboard,
            color: "indigo",
            end: true,
          },
          {
            label: "Warehouse Dashboard",
            path: `${basePath}/dashboard`,
            icon: Building2,
            color: "orange",
            end: true,
          },
          {
            label: "All Warehouses",
            path: `${basePath}/warehouses`,
            icon: Building2,
            color: "teal",
            end: false,
          },
        ]
      : [
          {
            label: "Dashboard",
            path: `${basePath}/dashboard`,
            icon: LayoutDashboard,
            color: "indigo",
            end: true,
          },
        ]),
    {
      label: "Inventory",
      path: `${basePath}/inventory`,
      icon: Box,
      color: "amber",
      end: false,
    },
    {
      label: "Stock In / Out",
      icon: ArrowRightLeft,
      color: "emerald",
      children: [
        { label: "Stock Inward", path: `${basePath}/inward` },
        { label: "Stock Outward", path: `${basePath}/outward` },
      ],
    },
    {
      label: "Fulfillment",
      icon: Truck,
      color: "blue",
      children: [
        { label: "Warehouse Orders", path: `${basePath}/orders` },
        { label: "Picking & Packing", path: `${basePath}/fulfillment` },
        { label: "Pickup Addresses", path: `${basePath}/pickup-addresses` },
      ],
    },
    {
      label: "Stock Transfers",
      path: `${basePath}/transfers`,
      icon: ArrowRightLeft,
      color: "violet",
      end: false,
    },
    {
      label: "Stock Exceptions",
      icon: AlertTriangle,
      color: "rose",
      children: [
        { label: "Damaged & Defective", path: `${basePath}/damaged` },
        { label: "Returned Items", path: `${basePath}/returns` },
        { label: "Stock Adjustments", path: `${basePath}/adjustments` },
      ],
    },
    {
      label: "Audit & Reports",
      icon: ClipboardList,
      color: "slate",
      children: [
        { label: "Movement History", path: `${basePath}/audit` },
        { label: "Low Stock Alerts", path: `${basePath}/low-stock` },
        { label: "Out of Stock Items", path: `${basePath}/out-of-stock` },
        { label: "Operational Reports", path: `${basePath}/reports` },
      ],
    },
  ];
};

const WarehouseMgmtRoutes = () => {
  const { user, authData, role } = useAuth();
  const location = useLocation();

  const isAdmin = role === "admin" || user?.role === "admin" || Boolean(authData?.admin);
  const isWarehouseUser = !isAdmin && (role === "warehouse" || role === "warehouse_mgmt" || user?.role === "warehouse");
  const basePath = location.pathname.startsWith("/warehouse-mgmt") ? "/warehouse-mgmt" : "/warehouse";

  useEffect(() => {
    if (isAdmin) {
      setActiveRole(ROLES.ADMIN);
    } else {
      setActiveRole(ROLES.WAREHOUSE);
    }
  }, [isAdmin]);

  const effectiveNavItems = useMemo(() => {
    const nav = buildNavItems(basePath, isWarehouseUser, isAdmin);
    if (!isAdmin) return nav;
    return [
      {
        label: "Back to Admin Center",
        path: "/admin",
        icon: ArrowLeft,
        color: "indigo",
        end: false,
      },
      ...nav,
    ];
  }, [basePath, isWarehouseUser, isAdmin]);

  const defaultRedirect = isAdmin ? `${basePath}/overview` : `${basePath}/dashboard`;
  const portalTitle = isWarehouseUser
    ? (user?.warehouseName || user?.name || "Warehouse Portal")
    : "Warehouse Operations";

  return (
    <DashboardLayout navItems={effectiveNavItems} title={portalTitle}>
      <Routes>
        <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
        {isAdmin && <Route path="/overview" element={<NetworkOverview />} />}
        <Route path="/dashboard" element={<Dashboard />} />
        {isAdmin && <Route path="/warehouses" element={<Warehouses />} />}
        {isAdmin && <Route path="/warehouses/:warehouseId" element={<WarehouseDetail />} />}
        {!isAdmin && <Route path="/warehouses*" element={<Navigate to={defaultRedirect} replace />} />}
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inward" element={<StockInward />} />
        <Route path="/outward" element={<StockOutward />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/fulfillment" element={<Fulfillment />} />
        <Route path="/pickup-addresses" element={<PickupAddresses />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/damaged" element={<DamagedDefective />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/adjustments" element={<StockAdjustments />} />
        <Route path="/audit" element={<StockAudit />} />
        <Route path="/low-stock" element={<LowStock />} />
        <Route path="/out-of-stock" element={<OutOfStock />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default WarehouseMgmtRoutes;

