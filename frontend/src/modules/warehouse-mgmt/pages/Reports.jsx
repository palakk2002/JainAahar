import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import StatCard from "@shared/components/ui/StatCard";
import DataTable from "@shared/components/ui/DataTable";
import FilterBar from "@shared/components/ui/FilterBar";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { Download, FileSpreadsheet, BarChart2, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

export const Reports = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [activeReport, setActiveReport] = useState("inventory");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-17");

  useEffect(() => {
    fetchReport();
  }, [activeReport, selectedWarehouse]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeReport === "inventory") {
        const res = await warehouseMgmtApi.getInventory(selectedWarehouse);
        if (res.data.success) setReportData(res.data.result);
      } else if (activeReport === "movement" || activeReport === "inward" || activeReport === "outward") {
        const res = await warehouseMgmtApi.getMovements(selectedWarehouse);
        if (res.data.success) {
          let data = res.data.result;
          if (activeReport === "inward") data = data.filter((m) => m.movementType === "Stock Inward");
          if (activeReport === "outward") data = data.filter((m) => m.quantity < 0 || m.movementType === "Customer Order");
          setReportData(data);
        }
      } else if (activeReport === "transfer") {
        const res = await warehouseMgmtApi.getTransfers(selectedWarehouse);
        if (res.data.success) setReportData(res.data.result);
      } else if (activeReport === "damaged") {
        const res = await warehouseMgmtApi.getDamagedItems(selectedWarehouse);
        if (res.data.success) setReportData(res.data.result);
      } else if (activeReport === "return") {
        const res = await warehouseMgmtApi.getReturns(selectedWarehouse);
        if (res.data.success) setReportData(res.data.result);
      } else if (activeReport === "orders") {
        const res = await warehouseMgmtApi.getOrders(selectedWarehouse);
        if (res.data.success) setReportData(res.data.result);
      } else if (activeReport === "lowstock") {
        const res = await warehouseMgmtApi.getInventory(selectedWarehouse);
        if (res.data.success) setReportData(res.data.result.filter((i) => i.status === "Low Stock"));
      }
    } catch (err) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("No data available to export");
      return;
    }
    const headers = Object.keys(reportData[0]).join(",");
    const rows = reportData.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `warehouse_${activeReport}_report_${selectedWarehouse}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported to CSV");
  };

  const reportTabs = [
    { id: "inventory", label: "Inventory Report" },
    { id: "movement", label: "Stock Movement" },
    { id: "inward", label: "Inward Report" },
    { id: "outward", label: "Outward Report" },
    { id: "transfer", label: "Transfer Report" },
    { id: "damaged", label: "Damaged/Defective" },
    { id: "return", label: "Return Report" },
    { id: "orders", label: "Warehouse Orders" },
    { id: "lowstock", label: "Low Stock Report" },
  ];

  const renderTableColumns = () => {
    if (activeReport === "inventory" || activeReport === "lowstock") {
      return [
        { header: "Product", accessor: "productName" },
        { header: "SKU", accessor: "sku" },
        { header: "Warehouse", accessor: "warehouseName" },
        { header: "Available Stock", accessor: "available", align: "right" },
        { header: "Reserved", accessor: "reserved", align: "right" },
        { header: "Total Stock", accessor: "total", align: "right" },
        { header: "Status", accessor: "status" },
      ];
    }
    if (activeReport === "transfer") {
      return [
        { header: "Transfer #", accessor: "transferNumber" },
        { header: "From", accessor: "sourceWarehouseName" },
        { header: "To", accessor: "destWarehouseName" },
        { header: "Product", accessor: "productName" },
        { header: "Qty", accessor: "quantity", align: "center" },
        { header: "Status", accessor: "status" },
      ];
    }
    if (activeReport === "orders") {
      return [
        { header: "Order ID", accessor: "id" },
        { header: "Customer", accessor: "customerName" },
        { header: "Warehouse", accessor: "warehouseName" },
        { header: "Amount", cell: (r) => `₹${r.totalAmount}`, align: "right" },
        { header: "Fulfillment Status", accessor: "fulfillmentStatus" },
      ];
    }
    return [
      { header: "Product", accessor: "productName" },
      { header: "SKU", accessor: "sku" },
      { header: "Warehouse", accessor: "warehouseName" },
      { header: "Qty / Val", accessor: "quantity", align: "center" },
      { header: "Reason / Detail", accessor: "reason" },
    ];
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Warehouse Operational Reports"
        description="Comprehensive analytics, audit exports & stock intelligence reports"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Download size={15} /> Export CSV Report
            </button>
            <WarehouseSelector
              selectedWarehouse={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          </div>
        }
      />

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeReport === tab.id ? "bg-primary text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        {/* Date Filters Bar */}
        <FilterBar
          left={
            <div className="flex items-center gap-2 text-xs">
              <Calendar size={14} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="ds-input"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="ds-input"
              />
            </div>
          }
          right={
            <span className="text-xs font-bold text-slate-500">
              Total Records: <strong className="text-slate-900">{reportData.length}</strong>
            </span>
          }
        />

        {loading ? (
          <div className="h-48 flex items-center justify-center"><Loader /></div>
        ) : (
          <DataTable columns={renderTableColumns()} data={reportData} />
        )}
      </Card>
    </div>
  );
};

export default Reports;
