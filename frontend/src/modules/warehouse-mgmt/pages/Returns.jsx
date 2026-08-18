import React, { useState, useEffect } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import DataTable from "@shared/components/ui/DataTable";
import Badge from "@shared/components/ui/Badge";
import Loader from "@shared/components/ui/Loader";
import WarehouseSelector from "../components/WarehouseSelector";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import { useWarehouseContext } from "../hooks/useWarehouseContext";
import { RotateCcw, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Returns = () => {
  const { isWarehouseUser, getActiveWarehouse } = useWarehouseContext();
  const [selectedWarehouse, setSelectedWarehouse] = useState(getActiveWarehouse("all"));
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, [selectedWarehouse, isWarehouseUser]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const activeWhId = getActiveWarehouse(selectedWarehouse);
      const res = await warehouseMgmtApi.getReturns(activeWhId);
      if (res.data.success) setReturns(res.data.result);
    } catch (err) {
      toast.error("Failed to load return records");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (returnId, decision) => {
    try {
      await warehouseMgmtApi.updateReturnDecision(returnId, decision);
      toast.success(`Return #${returnId} decision marked as ${decision}`);
      fetchReturns();
    } catch (err) {
      toast.error("Failed to update decision");
    }
  };

  const columns = [
    {
      header: "Return ID",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block text-xs">{row.returnId}</span>
          <span className="text-[10px] text-slate-400 font-mono">Order: {row.orderId}</span>
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
      header: "Qty",
      cell: (row) => <span className="font-bold text-slate-900">{row.quantity}</span>,
      align: "center",
    },
    { header: "Return Reason", accessor: "returnReason" },
    {
      header: "Inspection",
      cell: (row) => (
        <Badge variant={row.inspectionStatus === "Inspected" ? "success" : "warning"}>
          {row.inspectionStatus}
        </Badge>
      ),
    },
    {
      header: "Final Decision",
      cell: (row) => (
        <Badge
          variant={
            row.finalDecision === "Restock"
              ? "success"
              : row.finalDecision === "Damaged"
              ? "error"
              : row.finalDecision === "Pending"
              ? "warning"
              : "gray"
          }
        >
          {row.finalDecision}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          {row.inspectionStatus === "Pending Inspection" ? (
            <>
              <button
                onClick={() => handleDecision(row.id, "Restock")}
                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100"
              >
                Restock
              </button>
              <button
                onClick={() => handleDecision(row.id, "Damaged")}
                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100"
              >
                Damaged
              </button>
            </>
          ) : (
            <span className="text-[10px] font-bold text-slate-400">Decision Set</span>
          )}
        </div>
      ),
      align: "right",
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Returned Product Inspection"
        description="Receive returned packages, perform quality inspection & set disposition"
        actions={
          <WarehouseSelector
            selectedWarehouse={selectedWarehouse}
            onChange={setSelectedWarehouse}
          />
        }
      />

      <Card className="p-5">
        <DataTable columns={columns} data={returns} />
      </Card>
    </div>
  );
};

export default Returns;
