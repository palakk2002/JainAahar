import { handleResponse } from "../utils/helper.js";
import getPagination from "../utils/pagination.js";
import {
  getFulfillmentsList,
  getFulfillmentById,
  acceptFulfillment,
  startPicking,
  updateItemPickStatus,
  startPacking,
  markPacked,
  markReadyToShip,
  cancelFulfillment,
  getWarehouseFulfillmentStats,
  createShiprocketShipmentForFulfillment,
  markShipped,
  markCompleted,
} from "../services/warehouseFulfillmentService.js";
import { resolveEffectiveWarehouseId } from "../services/warehouseInventoryService.js";

/**
 * GET /api/warehouse/fulfillments
 */
export const getFulfillmentsHandler = async (req, res) => {
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

    const data = await getFulfillmentsList({
      warehouseId: warehouseId || "all",
      status,
      search,
      page,
      limit,
      skip,
    });

    return handleResponse(
      res,
      200,
      "Fulfillments retrieved successfully",
      data,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve fulfillments",
    );
  }
};

/**
 * GET /api/warehouse/fulfillments/stats
 */
export const getFulfillmentStatsHandler = async (req, res) => {
  try {
    const warehouseId = resolveEffectiveWarehouseId(
      req.user,
      req.query.warehouseId,
    );

    const stats = await getWarehouseFulfillmentStats({
      warehouseId: warehouseId || "all",
    });

    return handleResponse(
      res,
      200,
      "Fulfillment stats retrieved successfully",
      stats,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve fulfillment stats",
    );
  }
};

/**
 * GET /api/warehouse/fulfillments/:id
 */
export const getFulfillmentDetailHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const fulfillment = await getFulfillmentById(id, req.user);
    return handleResponse(
      res,
      200,
      "Fulfillment details retrieved",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to retrieve fulfillment details",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/accept
 */
export const acceptFulfillmentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const fulfillment = await acceptFulfillment({ id, user: req.user });
    return handleResponse(
      res,
      200,
      "Fulfillment accepted successfully",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to accept fulfillment",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/start-picking
 */
export const startPickingHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const fulfillment = await startPicking({ id, user: req.user });
    return handleResponse(
      res,
      200,
      "Picking started for fulfillment",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to start picking",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/update-item-pick
 */
export const updateItemPickHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, pickedQty, shortQty = 0, shortReason = "" } = req.body;

    if (!productId) {
      return handleResponse(res, 400, "Product ID is required");
    }

    const fulfillment = await updateItemPickStatus({
      id,
      user: req.user,
      productId,
      pickedQty,
      shortQty,
      shortReason,
    });

    return handleResponse(
      res,
      200,
      "Item pick status updated",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to update item pick status",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/start-packing
 */
export const startPackingHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const fulfillment = await startPacking({ id, user: req.user });
    return handleResponse(
      res,
      200,
      "Packing started for fulfillment",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to start packing",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/packed
 */
export const markPackedHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = "" } = req.body;
    const fulfillment = await markPacked({ id, user: req.user, notes });
    return handleResponse(
      res,
      200,
      "Fulfillment marked as packed",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to mark fulfillment packed",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/ready-to-ship
 */
export const markReadyToShipHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = "" } = req.body;
    const fulfillment = await markReadyToShip({ id, user: req.user, notes });
    return handleResponse(
      res,
      200,
      "Fulfillment marked as READY_TO_SHIP. Stock committed.",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to mark fulfillment ready to ship",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/create-shipment
 */
export const createShipmentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const fulfillmentDoc = await getFulfillmentById(id, req.user);
    const result = await createShiprocketShipmentForFulfillment(fulfillmentDoc);
    return handleResponse(
      res,
      200,
      "Shiprocket shipment created successfully",
      result,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to create Shiprocket shipment",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/mark-shipped
 */
export const markShippedHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { awbCode, courierName, trackingUrl, notes } = req.body;
    const fulfillment = await markShipped({
      id,
      user: req.user,
      awbCode,
      courierName,
      trackingUrl,
      notes,
    });
    return handleResponse(
      res,
      200,
      "Fulfillment marked as SHIPPED",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to mark fulfillment shipped",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/mark-completed
 */
export const markCompletedHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const fulfillment = await markCompleted({
      id,
      user: req.user,
      notes,
    });
    return handleResponse(
      res,
      200,
      "Fulfillment marked as COMPLETED (Delivered)",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to complete fulfillment",
    );
  }
};

/**
 * POST /api/warehouse/fulfillments/:id/cancel
 */
export const cancelFulfillmentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Cancelled by user" } = req.body;
    const fulfillment = await cancelFulfillment({
      id,
      user: req.user,
      reason,
    });
    return handleResponse(
      res,
      200,
      "Fulfillment cancelled and stock reservation released",
      fulfillment,
    );
  } catch (error) {
    return handleResponse(
      res,
      error.statusCode || 500,
      error.message || "Failed to cancel fulfillment",
    );
  }
};
