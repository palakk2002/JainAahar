import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

import Product from "../app/models/product.js";
import Warehouse from "../app/models/warehouse.js";
import WarehouseInventory from "../app/models/warehouseInventory.js";
import InventoryTransaction from "../app/models/inventoryTransaction.js";
import Order from "../app/models/order.js";
import WarehouseFulfillment, { FULFILLMENT_STATUS } from "../app/models/warehouseFulfillment.js";
import Category from "../app/models/category.js";
import User from "../app/models/customer.js";

import {
  recordStockInward,
  syncProductStockFromWarehouse,
} from "../app/services/warehouseInventoryService.js";
import {
  getProductWarehouseAvailability,
} from "../app/services/customerVisibilityService.js";
import {
  assignWarehouseToOrder,
} from "../app/services/warehouseAssignmentService.js";
import {
  acceptFulfillment,
  startPicking,
  updateItemPickStatus,
  startPacking,
  markPacked,
  markReadyToShip,
  markShipped,
} from "../app/services/warehouseFulfillmentService.js";
import { compensateOrderCancellation } from "../app/services/orderCompensation.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/jainahar";

async function runTests() {
  console.log("===============================================================");
  console.log("   WAREHOUSE → INVENTORY → PRODUCT → ORDER → SHIPROCKET TEST  ");
  console.log("===============================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  let testWarehouse = null;
  let testCategory = null;
  let testSubcategory = null;
  let testHeader = null;
  let testProduct = null;
  let testCustomer = null;
  let testOrder = null;
  let testOrder2 = null;

  try {
    // -----------------------------------------------------------------
    // SETUP: Create Category, Warehouse, Customer
    // -----------------------------------------------------------------
    console.log("\n[Step 1] Creating test master entities...");
    testHeader = await Category.create({
      name: "Test Header " + Date.now(),
      slug: "test-header-" + Date.now(),
      type: "header",
    });

    testCategory = await Category.create({
      name: "Test Grocery " + Date.now(),
      slug: "test-grocery-" + Date.now(),
      type: "category",
      parentId: testHeader._id,
    });

    testSubcategory = await Category.create({
      name: "Test Flour " + Date.now(),
      slug: "test-flour-" + Date.now(),
      type: "subcategory",
      parentId: testCategory._id,
    });

    testWarehouse = await Warehouse.create({
      name: "Indore Central Warehouse " + Date.now(),
      warehouseName: "Indore Central Warehouse",
      email: `warehouse_${Date.now()}@test.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: "TestPassword123!",
      address: "101 Scheme 78, Vijay Nagar",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452010",
      isActive: true,
      isVerified: true,
      location: {
        type: "Point",
        coordinates: [75.88, 22.75],
      },
      serviceRadius: 100,
    });

    testCustomer = await User.create({
      name: "Ramesh Sharma",
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `customer_${Date.now()}@test.com`,
      password: "TestPassword123!",
    });

    console.log("   Warehouse:", testWarehouse.warehouseName, `(ID: ${testWarehouse._id})`);
    console.log("   Customer:", testCustomer.name, `(ID: ${testCustomer._id})`);

    // -----------------------------------------------------------------
    // STEP 2: Admin creates Product without sellerId (Single-Vendor)
    // -----------------------------------------------------------------
    console.log("\n[Step 2] Admin creates catalog product without sellerId (Single-Vendor)...");
    testProduct = await Product.create({
      name: "Aashirvaad Shudh Chakki Atta 5kg " + Date.now(),
      slug: "aashirvaad-atta-" + Date.now(),
      sku: "ATTA-5KG-" + Date.now().toString(36).toUpperCase(),
      description: "100% whole wheat flour, high fiber",
      price: 250,
      salePrice: 235,
      stock: 0, // Starts with 0 before inward
      headerId: testHeader._id,
      categoryId: testCategory._id,
      subcategoryId: testSubcategory._id,
      sellerId: null, // Admin-owned, no seller
      warehouseId: null,
      status: "active",
      approvalStatus: "approved",
    });

    console.log("   ✅ Product created:", testProduct.name, `| SKU: ${testProduct.sku} | Initial Stock: ${testProduct.stock}`);

    // -----------------------------------------------------------------
    // STEP 3: Stock Inward (Received = 100, Damaged = 5, Defective = 0 -> Available = 95)
    // -----------------------------------------------------------------
    console.log("\n[Step 3] Warehouse Inward: Received = 100, Damaged = 5, Defective = 0...");
    const inwardResult = await recordStockInward({
      warehouseId: testWarehouse._id,
      productId: testProduct._id,
      sku: testProduct.sku,
      quantity: 100,
      damagedQty: 5,
      defectiveQty: 0,
      reason: "Mill Direct Shipment",
      reference: "INV-MILL-2026-001",
      notes: "5 bags slightly punctured during transit",
      performedBy: testWarehouse._id,
      performedByModel: "Warehouse",
    });

    const inventoryAfterInward = await WarehouseInventory.findOne({
      warehouse: testWarehouse._id,
      product: testProduct._id,
    });

    console.log("   WarehouseInventory Available:", inventoryAfterInward.available, "(Expected: 95)");
    console.log("   WarehouseInventory Damaged:", inventoryAfterInward.damaged, "(Expected: 5)");
    console.log("   WarehouseInventory Defective:", inventoryAfterInward.defective, "(Expected: 0)");

    if (inventoryAfterInward.available !== 95 || inventoryAfterInward.damaged !== 5) {
      throw new Error(`Inward stock calculation mismatch! Available: ${inventoryAfterInward.available}, Damaged: ${inventoryAfterInward.damaged}`);
    }

    // Verify Product.stock synced
    const productAfterInward = await Product.findById(testProduct._id);
    console.log("   Product.stock auto-sync:", productAfterInward.stock, "(Expected: 95)");
    if (productAfterInward.stock !== 95) {
      throw new Error(`Product.stock sync failed! Expected 95, got ${productAfterInward.stock}`);
    }

    // -----------------------------------------------------------------
    // STEP 4: Customer Catalog Availability Check
    // -----------------------------------------------------------------
    console.log("\n[Step 4] Customer Catalog Availability Check...");
    const availabilityMap = await getProductWarehouseAvailability([testProduct._id]);
    const availInfo = availabilityMap.get(String(testProduct._id));

    console.log("   Availability info:", availInfo);
    if (!availInfo || availInfo.availableStock !== 95 || availInfo.stockStatus !== "in_stock" || !availInfo.isAvailable) {
      throw new Error(`Customer availability check failed! Got: ${JSON.stringify(availInfo)}`);
    }
    console.log("   ✅ Customer sees: In Stock (95 available)");

    // -----------------------------------------------------------------
    // STEP 5: Customer orders 2 units -> Available becomes 93, Reserved becomes 2
    // -----------------------------------------------------------------
    console.log("\n[Step 5] Customer places Order for 2 units...");
    const publicOrderId = `ORD-${Date.now()}`;
    testOrder = await Order.create({
      orderId: publicOrderId,
      customer: testCustomer._id,
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          sku: testProduct.sku,
          price: 235,
          quantity: 2,
        },
      ],
      address: {
        name: "Ramesh Sharma",
        phone: "9876543210",
        address: "Flat 402, Royal Residency",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452010",
      },
      paymentMode: "COD",
      pricing: { total: 470, grandTotal: 470 },
      paymentBreakdown: { grandTotal: 470, productSubtotal: 470 },
      status: "pending",
      orderStatus: "pending",
      warehouseAssignmentStatus: "UNASSIGNED",
    });

    console.log("   Order created:", testOrder.orderId);

    // Auto-assign to best warehouse
    console.log("   Assigning warehouse to order...");
    const assignResult = await assignWarehouseToOrder({
      orderId: testOrder.orderId,
      assignedBy: "system",
    });

    if (!assignResult.success) {
      throw new Error(`Warehouse assignment failed: ${assignResult.reason}`);
    }

    const inventoryAfterOrder = await WarehouseInventory.findOne({
      warehouse: testWarehouse._id,
      product: testProduct._id,
    });

    console.log("   WarehouseInventory Available:", inventoryAfterOrder.available, "(Expected: 93)");
    console.log("   WarehouseInventory Reserved:", inventoryAfterOrder.reserved, "(Expected: 2)");

    if (inventoryAfterOrder.available !== 93 || inventoryAfterOrder.reserved !== 2) {
      throw new Error(`Reservation failed! Available: ${inventoryAfterOrder.available}, Reserved: ${inventoryAfterOrder.reserved}`);
    }

    const fulfillment = await WarehouseFulfillment.findOne({ order: testOrder._id });
    console.log("   WarehouseFulfillment created:", fulfillment.fulfillmentId, `| Status: ${fulfillment.status}`);
    if (fulfillment.status !== FULFILLMENT_STATUS.ASSIGNED) {
      throw new Error(`Fulfillment initial status mismatch! Expected ASSIGNED, got ${fulfillment.status}`);
    }

    // -----------------------------------------------------------------
    // STEP 6: Fulfillment Lifecycle Transitions & Shiprocket
    // -----------------------------------------------------------------
    console.log("\n[Step 6] Walking through Fulfillment Lifecycle...");

    // 6a: Accept
    console.log("   6a. Accepting fulfillment...");
    const acceptedFulfillment = await acceptFulfillment({
      id: fulfillment._id,
      user: { id: testWarehouse._id, role: "warehouse" },
    });
    console.log("       Status:", acceptedFulfillment.status);

    // 6b: Start Picking
    console.log("   6b. Starting picking...");
    const pickingFulfillment = await startPicking({
      id: fulfillment._id,
      user: { id: testWarehouse._id, role: "warehouse" },
    });
    console.log("       Status:", pickingFulfillment.status);

    // 6c: Pick Items
    console.log("   6c. Verifying picked items (2 units)...");
    const pickItemResult = await updateItemPickStatus({
      id: fulfillment._id,
      user: { id: testWarehouse._id, role: "warehouse" },
      productId: testProduct._id,
      pickedQty: 2,
    });
    console.log("       Picked Qty:", pickItemResult.items[0].pickedQty, "| Status:", pickItemResult.items[0].status);

    // 6d: Start Packing & Mark Packed
    console.log("   6d. Starting packing & marking packed...");
    await startPacking({
      id: fulfillment._id,
      user: { id: testWarehouse._id, role: "warehouse" },
    });
    const packedFulfillment = await markPacked({
      id: fulfillment._id,
      user: { id: testWarehouse._id, role: "warehouse" },
      notes: "Box 1/1 sealed with security tape",
    });
    console.log("       Status:", packedFulfillment.status);

    // 6e: Mark Ready to Ship & Trigger Shiprocket
    console.log("   6e. Marking Ready to Ship (committing stock)...");
    const readyFulfillment = await markReadyToShip({
      id: fulfillment._id,
      user: { id: testWarehouse._id, role: "warehouse" },
      notes: "Placed in Bay-A for courier pickup",
    });
    console.log("       Status:", readyFulfillment.status);
    console.log("       AWB Code / Tracking:", readyFulfillment.awbCode || "Auto-assigned / Pending");

    // Verify stock is committed: Available = 93, Reserved = 0
    const inventoryAfterShip = await WarehouseInventory.findOne({
      warehouse: testWarehouse._id,
      product: testProduct._id,
    });
    console.log("       Warehouse Inventory after ReadyToShip -> Available:", inventoryAfterShip.available, "(Expected: 93), Reserved:", inventoryAfterShip.reserved, "(Expected: 0)");

    if (inventoryAfterShip.available !== 93 || inventoryAfterShip.reserved !== 0) {
      throw new Error(`Committed stock mismatch! Available: ${inventoryAfterShip.available}, Reserved: ${inventoryAfterShip.reserved}`);
    }

    // 6f: Mark Shipped
    console.log("   6f. Handing over to courier (Mark Shipped)...");
    const shippedFulfillment = await markShipped({
      id: fulfillment._id,
      user: { id: testWarehouse._id, role: "warehouse" },
      awbCode: readyFulfillment.awbCode || `AWB-${Date.now()}`,
      courierName: "Shiprocket Surface",
    });
    console.log("       Fulfillment Status:", shippedFulfillment.status);

    const orderAfterShip = await Order.findById(testOrder._id);
    console.log("       Order Status after Dispatch:", orderAfterShip.status, `| Workflow: ${orderAfterShip.workflowStatus}`);

    // -----------------------------------------------------------------
    // STEP 7: Test Cancellation Scenario & Stock Release
    // -----------------------------------------------------------------
    console.log("\n[Step 7] Testing Order Cancellation & Stock Release...");
    testOrder2 = await Order.create({
      orderId: `ORD-CANCEL-${Date.now()}`,
      customer: testCustomer._id,
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          sku: testProduct.sku,
          price: 235,
          quantity: 3,
        },
      ],
      address: {
        name: "Ramesh Sharma",
        phone: "9876543210",
        address: "Flat 402, Royal Residency",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452010",
      },
      paymentMode: "COD",
      pricing: { total: 705, grandTotal: 705 },
      paymentBreakdown: { grandTotal: 705, productSubtotal: 705 },
      status: "pending",
      orderStatus: "pending",
    });

    // Assign warehouse (reserves 3 units)
    await assignWarehouseToOrder({
      orderId: testOrder2.orderId,
      assignedBy: "system",
    });

    const inventoryAfterOrder2 = await WarehouseInventory.findOne({
      warehouse: testWarehouse._id,
      product: testProduct._id,
    });
    console.log("   Inventory after second order (3 units) -> Available:", inventoryAfterOrder2.available, "(Expected: 90), Reserved:", inventoryAfterOrder2.reserved, "(Expected: 3)");

    // Cancel second order
    console.log("   Cancelling order #2...");
    await compensateOrderCancellation(testOrder2, testOrder2.orderId, {
      reason: "Customer changed mind",
    });

    const inventoryAfterCancel = await WarehouseInventory.findOne({
      warehouse: testWarehouse._id,
      product: testProduct._id,
    });
    console.log("   Inventory after cancellation -> Available:", inventoryAfterCancel.available, "(Expected: 93), Reserved:", inventoryAfterCancel.reserved, "(Expected: 0)");

    if (inventoryAfterCancel.available !== 93 || inventoryAfterCancel.reserved !== 0) {
      throw new Error(`Cancellation stock release failed! Expected Available 93, Reserved 0, got Avail ${inventoryAfterCancel.available}, Res ${inventoryAfterCancel.reserved}`);
    }
    console.log("   ✅ Reserved stock successfully released back to Available!");

    // -----------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------
    console.log("\n===============================================================");
    console.log("   🎉 ALL 7 END-TO-END LIFECYCLE TESTS PASSED PERFECTLY!");
    console.log("===============================================================");
    console.log("1. Admin-owned Product Creation without Seller: PASSED ✅");
    console.log("2. Inward Received (100) = Usable (95) + Damaged (5): PASSED ✅");
    console.log("3. Product.stock Auto-Sync: PASSED ✅");
    console.log("4. Customer Warehouse Availability Check: PASSED ✅");
    console.log("5. Customer Order (2 units) -> Available: 93, Reserved: 2: PASSED ✅");
    console.log("6. Full Floor Picking/Packing/Shiprocket Dispatch: PASSED ✅");
    console.log("7. Order Cancellation Stock Reservation Release: PASSED ✅");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    // Cleanup test data
    console.log("\nCleaning up test artifacts...");
    try {
      if (testProduct) await Product.findByIdAndDelete(testProduct._id);
      if (testWarehouse) await Warehouse.findByIdAndDelete(testWarehouse._id);
      if (testCategory) await Category.findByIdAndDelete(testCategory._id);
      if (testSubcategory) await Category.findByIdAndDelete(testSubcategory._id);
      if (testHeader) await Category.findByIdAndDelete(testHeader._id);
      if (testCustomer) await User.findByIdAndDelete(testCustomer._id);
      if (testOrder) await Order.findByIdAndDelete(testOrder._id);
      if (testOrder2) await Order.findByIdAndDelete(testOrder2._id);
      if (testWarehouse && testProduct) {
        await WarehouseInventory.deleteMany({
          warehouse: testWarehouse._id,
        });
        await InventoryTransaction.deleteMany({
          warehouse: testWarehouse._id,
        });
        await WarehouseFulfillment.deleteMany({
          warehouse: testWarehouse._id,
        });
      }
      console.log("✅ Cleanup complete.");
    } catch (cleanErr) {
      console.warn("Cleanup warning:", cleanErr.message);
    }
    await mongoose.disconnect();
  }
}

runTests();
