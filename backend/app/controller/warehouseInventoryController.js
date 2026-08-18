import { handleResponse } from "../utils/helper.js";
import getPagination from "../utils/pagination.js";
import {
  getWarehouseInventory,
  getLowStockInventory,
  getOutOfStockInventory,
  getWarehouseInventorySummary,
  getInventoryTransactionHistory,
  recordStockInward,
  recordStockOutward,
  recordStockAdjustment,
  recordDamagedStock,
  recordDefectiveStock,
  recordRestockFromDamaged,
  resolveEffectiveWarehouseId,
} from "../services/warehouseInventoryService.js";

/**
 * GET /api/warehouse/inventory
 * List inventory for the authenticated warehouse (or target warehouse if admin).
 */
export const getInventoryHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.query.warehouseId || req.params.warehouseId,
    );

    if (!warehouseId && req.user.role !== "admin") {
      return handleResponse(res, 403, "Access denied. Warehouse not identified.");
    }

    const { page, limit, skip } = getPagination(req, {
      defaultLimit: 25,
      maxLimit: 100,
    });
    const { search = "", status = "all", category = "" } = req.query;

    const data = await getWarehouseInventory({
      warehouseId: warehouseId || "all",
      search,
      status,
      category,
      page,
      limit,
      skip,
    });

    return handleResponse(res, 200, "Inventory retrieved successfully", data);
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve inventory",
    );
  }
};

/**
 * GET /api/warehouse/inventory/low-stock
 */
export const getLowStockHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.query.warehouseId || req.params.warehouseId,
    );

    if (!warehouseId && req.user.role !== "admin") {
      return handleResponse(res, 403, "Access denied. Warehouse not identified.");
    }

    const { page, limit, skip } = getPagination(req, {
      defaultLimit: 25,
      maxLimit: 100,
    });
    const { search = "" } = req.query;

    const data = await getLowStockInventory({
      warehouseId: warehouseId || "all",
      search,
      page,
      limit,
      skip,
    });

    return handleResponse(res, 200, "Low stock items retrieved successfully", data);
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve low stock items",
    );
  }
};

/**
 * GET /api/warehouse/inventory/out-of-stock
 */
export const getOutOfStockHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.query.warehouseId || req.params.warehouseId,
    );

    if (!warehouseId && req.user.role !== "admin") {
      return handleResponse(res, 403, "Access denied. Warehouse not identified.");
    }

    const { page, limit, skip } = getPagination(req, {
      defaultLimit: 25,
      maxLimit: 100,
    });
    const { search = "" } = req.query;

    const data = await getOutOfStockInventory({
      warehouseId: warehouseId || "all",
      search,
      page,
      limit,
      skip,
    });

    return handleResponse(res, 200, "Out of stock items retrieved successfully", data);
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve out of stock items",
    );
  }
};

/**
 * GET /api/warehouse/inventory/summary
 */
export const getInventorySummaryHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.query.warehouseId || req.params.warehouseId,
    );

    if (!warehouseId && req.user.role !== "admin") {
      return handleResponse(res, 403, "Access denied. Warehouse not identified.");
    }

    const summary = await getWarehouseInventorySummary({
      warehouseId: warehouseId || "all",
    });

    return handleResponse(
      res,
      200,
      "Inventory summary retrieved successfully",
      summary,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve inventory summary",
    );
  }
};

/**
 * GET /api/warehouse/inventory/transactions
 */
export const getInventoryTransactionsHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.query.warehouseId || req.params.warehouseId,
    );

    if (!warehouseId && req.user.role !== "admin") {
      return handleResponse(res, 403, "Access denied. Warehouse not identified.");
    }

    const { page, limit, skip } = getPagination(req, {
      defaultLimit: 25,
      maxLimit: 100,
    });
    const { productId, type = "", reference = "" } = req.query;

    const data = await getInventoryTransactionHistory({
      warehouseId: warehouseId || "all",
      productId,
      type,
      reference,
      page,
      limit,
      skip,
    });

    return handleResponse(
      res,
      200,
      "Inventory transactions retrieved successfully",
      data,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve inventory transactions",
    );
  }
};

/**
 * POST /api/warehouse/inventory/inward
 */
export const stockInwardHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.body.warehouseId || req.query.warehouseId,
    );

    if (!warehouseId) {
      return handleResponse(res, 400, "Warehouse ID is required");
    }

    const {
      productId,
      sku = "",
      quantity,
      reason = "Stock Received",
      reference = "",
      notes = "",
    } = req.body;

    if (!productId) {
      return handleResponse(res, 400, "Product ID is required");
    }

    if (!quantity || Number(quantity) <= 0) {
      return handleResponse(res, 400, "Quantity must be a positive number");
    }

    const performedByModel = req.user.role === "admin" ? "Admin" : "Warehouse";

    const result = await recordStockInward({
      warehouseId,
      productId,
      sku,
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user.id || req.user._id,
      performedByModel,
    });

    return handleResponse(res, 201, "Stock inward recorded successfully", result);
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to record stock inward",
    );
  }
};

/**
 * POST /api/warehouse/inventory/outward
 */
export const stockOutwardHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.body.warehouseId || req.query.warehouseId,
    );

    if (!warehouseId) {
      return handleResponse(res, 400, "Warehouse ID is required");
    }

    const {
      productId,
      sku = "",
      quantity,
      reason = "Stock Outward",
      reference = "",
      notes = "",
    } = req.body;

    if (!productId) {
      return handleResponse(res, 400, "Product ID is required");
    }

    if (!quantity || Number(quantity) <= 0) {
      return handleResponse(res, 400, "Quantity must be a positive number");
    }

    const performedByModel = req.user.role === "admin" ? "Admin" : "Warehouse";

    const result = await recordStockOutward({
      warehouseId,
      productId,
      sku,
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user.id || req.user._id,
      performedByModel,
    });

    return handleResponse(res, 200, "Stock outward recorded successfully", result);
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to record stock outward",
    );
  }
};

/**
 * POST /api/warehouse/inventory/adjust
 */
export const stockAdjustmentHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.body.warehouseId || req.query.warehouseId,
    );

    if (!warehouseId) {
      return handleResponse(res, 400, "Warehouse ID is required");
    }

    const {
      productId,
      sku = "",
      adjustmentType, // "INCREASE" or "DECREASE"
      quantity,
      reason = "Manual Adjustment",
      reference = "",
      notes = "",
    } = req.body;

    if (!productId) {
      return handleResponse(res, 400, "Product ID is required");
    }

    if (!quantity || Number(quantity) <= 0) {
      return handleResponse(res, 400, "Quantity must be a positive number");
    }

    if (!adjustmentType) {
      return handleResponse(
        res,
        400,
        "Adjustment type (INCREASE or DECREASE) is required",
      );
    }

    const performedByModel = req.user.role === "admin" ? "Admin" : "Warehouse";

    const result = await recordStockAdjustment({
      warehouseId,
      productId,
      sku,
      adjustmentType,
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user.id || req.user._id,
      performedByModel,
    });

    return handleResponse(
      res,
      200,
      "Stock adjustment recorded successfully",
      result,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to record stock adjustment",
    );
  }
};

/**
 * POST /api/warehouse/inventory/damaged
 */
export const stockDamagedHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.body.warehouseId || req.query.warehouseId,
    );

    if (!warehouseId) {
      return handleResponse(res, 400, "Warehouse ID is required");
    }

    const {
      productId,
      sku = "",
      quantity,
      reason = "Damaged Goods",
      reference = "",
      notes = "",
    } = req.body;

    if (!productId) {
      return handleResponse(res, 400, "Product ID is required");
    }

    if (!quantity || Number(quantity) <= 0) {
      return handleResponse(res, 400, "Quantity must be a positive number");
    }

    const performedByModel = req.user.role === "admin" ? "Admin" : "Warehouse";

    const result = await recordDamagedStock({
      warehouseId,
      productId,
      sku,
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user.id || req.user._id,
      performedByModel,
    });

    return handleResponse(
      res,
      200,
      "Damaged stock recorded successfully",
      result,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to record damaged stock",
    );
  }
};

/**
 * POST /api/warehouse/inventory/defective
 */
export const stockDefectiveHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.body.warehouseId || req.query.warehouseId,
    );

    if (!warehouseId) {
      return handleResponse(res, 400, "Warehouse ID is required");
    }

    const {
      productId,
      sku = "",
      quantity,
      reason = "Defective Goods",
      reference = "",
      notes = "",
    } = req.body;

    if (!productId) {
      return handleResponse(res, 400, "Product ID is required");
    }

    if (!quantity || Number(quantity) <= 0) {
      return handleResponse(res, 400, "Quantity must be a positive number");
    }

    const performedByModel = req.user.role === "admin" ? "Admin" : "Warehouse";

    const result = await recordDefectiveStock({
      warehouseId,
      productId,
      sku,
      quantity,
      reason,
      reference,
      notes,
      performedBy: req.user.id || req.user._id,
      performedByModel,
    });

    return handleResponse(
      res,
      200,
      "Defective stock recorded successfully",
      result,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to record defective stock",
    );
  }
};

/**
 * POST /api/warehouse/inventory/restock
 */
export const stockRestockHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.body.warehouseId || req.query.warehouseId,
    );

    if (!warehouseId) {
      return handleResponse(res, 400, "Warehouse ID is required");
    }

    const {
      productId,
      sku = "",
      quantity,
      fromType = "damaged",
      reason = "Restocked from quarantine",
      reference = "",
      notes = "",
    } = req.body;

    if (!productId) {
      return handleResponse(res, 400, "Product ID is required");
    }

    if (!quantity || Number(quantity) <= 0) {
      return handleResponse(res, 400, "Quantity must be a positive number");
    }

    const performedByModel = req.user.role === "admin" ? "Admin" : "Warehouse";

    const result = await recordRestockFromDamaged({
      warehouseId,
      productId,
      sku,
      quantity,
      fromType,
      reason,
      reference,
      notes,
      performedBy: req.user.id || req.user._id,
      performedByModel,
    });

    return handleResponse(
      res,
      200,
      "Stock restocked successfully",
      result,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to restock items",
    );
  }
};
