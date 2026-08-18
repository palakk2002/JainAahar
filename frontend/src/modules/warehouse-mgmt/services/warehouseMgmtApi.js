import { mockWarehouses } from "../data/mockWarehouses";
import { mockProducts } from "../data/mockProducts";
import { mockInventory } from "../data/mockInventory";
import { mockOrders } from "../data/mockOrders";
import { mockTransfers } from "../data/mockTransfers";
import { mockMovements } from "../data/mockMovements";
import { mockReturns } from "../data/mockReturns";
import { mockDamagedItems } from "../data/mockDamaged";
import { mockAdjustments } from "../data/mockAdjustments";
import { mockAlerts } from "../data/mockAlerts";

// In-memory state for interactive frontend testing
let warehousesState = [...mockWarehouses];
let productsState = [...mockProducts];
let inventoryState = [...mockInventory];
let ordersState = [...mockOrders];
let transfersState = [...mockTransfers];
let movementsState = [...mockMovements];
let returnsState = [...mockReturns];
let damagedState = [...mockDamagedItems];
let adjustmentsState = [...mockAdjustments];
let alertsState = [...mockAlerts];

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const warehouseMgmtApi = {
  // Warehouses
  async getWarehouses() {
    await delay();
    return { data: { success: true, result: warehousesState } };
  },

  async getWarehouseById(id) {
    await delay();
    const wh = warehousesState.find((w) => w.id === id);
    if (!wh) return { data: { success: false, message: "Warehouse not found" } };
    return { data: { success: true, result: wh } };
  },

  async updateWarehouse(id, updateData) {
    await delay();
    warehousesState = warehousesState.map((w) =>
      w.id === id ? { ...w, ...updateData } : w
    );
    const updated = warehousesState.find((w) => w.id === id);
    return { data: { success: true, result: updated } };
  },

  // Products
  async getProducts() {
    await delay();
    return { data: { success: true, result: productsState } };
  },

  // Inventory
  async getInventory(warehouseId = "all") {
    await delay();
    let result = inventoryState;
    if (warehouseId && warehouseId !== "all") {
      result = result.filter((item) => item.warehouseId === warehouseId);
    }
    return { data: { success: true, result } };
  },

  // Stock Inward
  async createInward(inwardData) {
    await delay();
    const newMovement = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString(),
      productId: inwardData.productId,
      productName: inwardData.productName,
      sku: inwardData.sku,
      warehouseId: inwardData.warehouseId,
      warehouseName: inwardData.warehouseName,
      movementType: "Stock Inward",
      quantity: Number(inwardData.quantity),
      beforeQty: 100,
      afterQty: 100 + Number(inwardData.quantity),
      reference: inwardData.reference || `INV-${Date.now().toString().slice(-4)}`,
      user: "Current User",
      reason: inwardData.notes || `Stock Inward via ${inwardData.source}`,
    };
    movementsState = [newMovement, ...movementsState];

    // Update inventory item in local state
    inventoryState = inventoryState.map((inv) => {
      if (inv.warehouseId === inwardData.warehouseId && inv.productId === inwardData.productId) {
        const newAvail = inv.available + Number(inwardData.quantity);
        return {
          ...inv,
          available: newAvail,
          total: newAvail + inv.reserved + inv.damaged + inv.defective,
          status: newAvail > inv.minStock ? "In Stock" : newAvail > 0 ? "Low Stock" : "Out of Stock",
          lastUpdated: new Date().toISOString(),
        };
      }
      return inv;
    });

    return { data: { success: true, result: newMovement } };
  },

  // Orders & Fulfillment
  async getOrders(warehouseId = "all") {
    await delay();
    let result = ordersState;
    if (warehouseId && warehouseId !== "all") {
      result = result.filter((o) => o.warehouseId === warehouseId);
    }
    return { data: { success: true, result } };
  },

  async updateFulfillmentStatus(orderId, status) {
    await delay();
    ordersState = ordersState.map((o) =>
      o.id === orderId ? { ...o, fulfillmentStatus: status } : o
    );
    const updated = ordersState.find((o) => o.id === orderId);
    return { data: { success: true, result: updated } };
  },

  async updateItemPicking(orderId, productId, pickedQty) {
    await delay();
    ordersState = ordersState.map((o) => {
      if (o.id === orderId) {
        const updatedItems = o.items.map((item) =>
          item.productId === productId ? { ...item, pickedQty } : item
        );
        const allPicked = updatedItems.every((it) => it.pickedQty >= it.qty);
        return {
          ...o,
          items: updatedItems,
          pickingStatus: allPicked ? "Picked" : "In Progress",
          fulfillmentStatus: allPicked ? "Picking" : "Picking",
        };
      }
      return o;
    });
    return { data: { success: true } };
  },

  // Transfers
  async getTransfers(warehouseId = "all") {
    await delay();
    let result = transfersState;
    if (warehouseId && warehouseId !== "all") {
      result = result.filter(
        (t) => t.sourceWarehouseId === warehouseId || t.destWarehouseId === warehouseId
      );
    }
    return { data: { success: true, result } };
  },

  async createTransfer(transferData) {
    await delay();
    const newTransfer = {
      id: `TR-2026-${(transfersState.length + 1).toString().padStart(3, "0")}`,
      transferNumber: `TR-${transferData.sourceWarehouseId.slice(-3).toUpperCase()}-${transferData.destWarehouseId.slice(-3).toUpperCase()}-${Date.now().toString().slice(-2)}`,
      ...transferData,
      requestDate: new Date().toISOString(),
      status: "Requested",
    };
    transfersState = [newTransfer, ...transfersState];
    return { data: { success: true, result: newTransfer } };
  },

  async updateTransferStatus(transferId, status) {
    await delay();
    transfersState = transfersState.map((t) =>
      t.id === transferId ? { ...t, status } : t
    );
    return { data: { success: true } };
  },

  // Damaged & Defective
  async getDamagedItems(warehouseId = "all") {
    await delay();
    let result = damagedState;
    if (warehouseId && warehouseId !== "all") {
      result = result.filter((d) => d.warehouseId === warehouseId);
    }
    return { data: { success: true, result } };
  },

  async addDamagedItem(itemData) {
    await delay();
    const newItem = {
      id: `DMG-${Date.now().toString().slice(-4)}`,
      ...itemData,
      reportedDate: new Date().toISOString(),
      status: "Quarantined",
    };
    damagedState = [newItem, ...damagedState];
    return { data: { success: true, result: newItem } };
  },

  // Returns
  async getReturns(warehouseId = "all") {
    await delay();
    let result = returnsState;
    if (warehouseId && warehouseId !== "all") {
      result = result.filter((r) => r.warehouseId === warehouseId);
    }
    return { data: { success: true, result } };
  },

  async updateReturnDecision(returnId, decision) {
    await delay();
    returnsState = returnsState.map((r) =>
      r.id === returnId
        ? { ...r, finalDecision: decision, inspectionStatus: "Inspected" }
        : r
    );
    return { data: { success: true } };
  },

  // Adjustments
  async getAdjustments(warehouseId = "all") {
    await delay();
    let result = adjustmentsState;
    if (warehouseId && warehouseId !== "all") {
      result = result.filter((a) => a.warehouseId === warehouseId);
    }
    return { data: { success: true, result } };
  },

  async createAdjustment(adjData) {
    await delay();
    const newAdj = {
      id: `ADJ-2026-${(adjustmentsState.length + 1).toString().padStart(3, "0")}`,
      ...adjData,
      date: new Date().toISOString(),
      user: "Warehouse Manager",
    };
    adjustmentsState = [newAdj, ...adjustmentsState];
    return { data: { success: true, result: newAdj } };
  },

  // Audit Movements
  async getMovements(warehouseId = "all") {
    await delay();
    let result = movementsState;
    if (warehouseId && warehouseId !== "all") {
      result = result.filter((m) => m.warehouseId === warehouseId);
    }
    return { data: { success: true, result } };
  },

  // Dashboard Stats calculation
  async getDashboardStats(warehouseId = "all") {
    await delay();

    let inv = inventoryState;
    let ord = ordersState;
    let trs = transfersState;
    let ret = returnsState;

    if (warehouseId && warehouseId !== "all") {
      inv = inv.filter((i) => i.warehouseId === warehouseId);
      ord = ord.filter((o) => o.warehouseId === warehouseId);
      trs = trs.filter((t) => t.sourceWarehouseId === warehouseId || t.destWarehouseId === warehouseId);
      ret = ret.filter((r) => r.warehouseId === warehouseId);
    }

    const totalSkus = new Set(inv.map((i) => i.sku)).size;
    const totalStockUnits = inv.reduce((sum, i) => sum + i.total, 0);
    const availableStock = inv.reduce((sum, i) => sum + i.available, 0);
    const reservedStock = inv.reduce((sum, i) => sum + i.reserved, 0);
    const damagedStock = inv.reduce((sum, i) => sum + i.damaged, 0);
    const defectiveStock = inv.reduce((sum, i) => sum + i.defective, 0);
    const lowStockItems = inv.filter((i) => i.status === "Low Stock").length;
    const outOfStockItems = inv.filter((i) => i.status === "Out of Stock").length;
    const pendingTransfers = trs.filter((t) => t.status === "In Transit" || t.status === "Requested" || t.status === "Approved").length;
    const pendingReturns = ret.filter((r) => r.inspectionStatus === "Pending Inspection").length;
    const pendingFulfillmentOrders = ord.filter((o) => o.fulfillmentStatus !== "Completed" && o.fulfillmentStatus !== "Cancelled").length;

    return {
      data: {
        success: true,
        result: {
          totalWarehouses: warehousesState.length,
          totalSkus,
          totalStockUnits,
          availableStock,
          reservedStock,
          damagedStock,
          defectiveStock,
          lowStockItems,
          outOfStockItems,
          pendingTransfers,
          pendingReturns,
          pendingFulfillmentOrders,
        },
      },
    };
  },

  // Alerts
  async getAlerts() {
    await delay();
    return { data: { success: true, result: alertsState } };
  },
};
