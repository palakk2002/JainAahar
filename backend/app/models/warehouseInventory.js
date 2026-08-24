import mongoose from "mongoose";

/**
 * WarehouseInventory — per-warehouse, per-product stock tracking.
 *
 * This model is ADDITIVE and runs alongside the existing global Product.stock.
 * Product.stock remains used by the customer-facing checkout flow.
 * WarehouseInventory tracks physical stock at each warehouse location.
 *
 * Stock states:
 *   available  — sellable / physically present and free
 *   reserved   — held for a confirmed order pending fulfillment
 *   damaged    — quarantined; not available for sale
 *   defective  — quarantined; not available for sale
 *
 * total = available + reserved + damaged + defective
 */
const warehouseInventorySchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    /** Mirrors Product.sku for quick display without join */
    sku: {
      type: String,
      trim: true,
      default: "",
    },

    /** Units available for picking/sale */
    available: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Units reserved for confirmed order fulfillments */
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Units quarantined as damaged */
    damaged: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Units quarantined as defective */
    defective: {
      type: Number,
      default: 0,
      min: 0,
    },

    /** Low-stock threshold — alert when available <= minStock */
    minStock: {
      type: Number,
      default: 5,
      min: 0,
    },

    /** Denormalized for fast dashboard reads */
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

/** Primary lookup: warehouse + product must be unique */
warehouseInventorySchema.index({ warehouse: 1, product: 1 }, { unique: true });

/** Dashboard / report queries */
warehouseInventorySchema.index({ warehouse: 1, available: 1 });
warehouseInventorySchema.index({ warehouse: 1, sku: 1 });

/** Virtual: computed total */
if (typeof warehouseInventorySchema.virtual === "function") {
  warehouseInventorySchema.virtual("total").get(function () {
    return this.available + this.reserved + this.damaged + this.defective;
  });

  /** Convenience: is this item low on stock? */
  warehouseInventorySchema.virtual("isLowStock").get(function () {
    return this.available > 0 && this.available <= this.minStock;
  });

  /** Convenience: is this item out of stock? */
  warehouseInventorySchema.virtual("isOutOfStock").get(function () {
    return this.available <= 0;
  });
}

if (typeof warehouseInventorySchema.set === "function") {
  warehouseInventorySchema.set("toJSON", { virtuals: true });
  warehouseInventorySchema.set("toObject", { virtuals: true });
}

export default mongoose.model("WarehouseInventory", warehouseInventorySchema);
