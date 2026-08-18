import { handleResponse } from "../utils/helper.js";
import getPagination from "../utils/pagination.js";
import {
  getTransfersList,
  getTransferById,
  createStockTransferRequest,
  approveAndDispatchTransfer,
  receiveTransfer,
  cancelStockTransfer,
} from "../services/warehouseTransferService.js";
import { resolveEffectiveWarehouseId } from "../services/warehouseInventoryService.js";

/**
 * GET /api/warehouse/transfers
 * List transfers involving the authenticated warehouse (or all for admin).
 */
export const getTransfersHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.query.warehouseId,
    );

    const { page, limit, skip } = getPagination(req, {
      defaultLimit: 25,
      maxLimit: 100,
    });
    const { status = "all", search = "" } = req.query;

    const data = await getTransfersList({
      warehouseId: warehouseId || "all",
      status,
      search,
      page,
      limit,
      skip,
    });

    return handleResponse(res, 200, "Transfers retrieved successfully", data);
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve transfers",
    );
  }
};

/**
 * GET /api/warehouse/transfers/:id
 */
export const getTransferDetailHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await getTransferById(id, req.user);
    return handleResponse(res, 200, "Transfer details retrieved", transfer);
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve transfer details",
    );
  }
};

/**
 * POST /api/warehouse/transfers
 * Create a new transfer request.
 */
export const createTransferHandler = async (req, res) => {
  try {
    const fromWarehouseId =
      req.user.role === "warehouse"
        ? req.user.id || req.user._id
        : req.body.fromWarehouseId;

    const { toWarehouseId, items = [], notes = "" } = req.body;

    if (!fromWarehouseId) {
      return handleResponse(res, 400, "Source warehouse ID is required");
    }

    if (!toWarehouseId) {
      return handleResponse(res, 400, "Destination warehouse ID is required");
    }

    const transfer = await createStockTransferRequest({
      fromWarehouseId,
      toWarehouseId,
      items,
      notes,
      requestedBy: req.user.id || req.user._id,
      userRole: req.user.role === "admin" ? "Admin" : "Warehouse",
    });

    return handleResponse(
      res,
      201,
      "Stock transfer requested successfully",
      transfer,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to create transfer request",
    );
  }
};

/**
 * PUT /api/warehouse/transfers/:id/approve
 * Source warehouse or Admin approves and dispatches the transfer into IN_TRANSIT.
 */
export const approveTransferHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await approveAndDispatchTransfer({
      transferId: id,
      approvedBy: req.user.id || req.user._id,
      user: req.user,
    });

    return handleResponse(
      res,
      200,
      "Transfer approved and dispatched into transit",
      transfer,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to approve transfer",
    );
  }
};

/**
 * PUT /api/warehouse/transfers/:id/receive
 * Destination warehouse or Admin confirms receiving the items.
 */
export const receiveTransferHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = "" } = req.body;

    const transfer = await receiveTransfer({
      transferId: id,
      receivedBy: req.user.id || req.user._id,
      user: req.user,
      notes,
    });

    return handleResponse(
      res,
      200,
      "Transfer received and stock credited successfully",
      transfer,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to receive transfer",
    );
  }
};

/**
 * PUT /api/warehouse/transfers/:id/cancel
 */
export const cancelTransferHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Transfer Cancelled" } = req.body;

    const transfer = await cancelStockTransfer({
      transferId: id,
      cancelledBy: req.user.id || req.user._id,
      user: req.user,
      reason,
    });

    return handleResponse(
      res,
      200,
      "Transfer cancelled successfully",
      transfer,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to cancel transfer",
    );
  }
};
