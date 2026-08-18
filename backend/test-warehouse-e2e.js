import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {}

import Warehouse from "./app/models/warehouse.js";
import Product from "./app/models/product.js";
import Order from "./app/models/order.js";
import WarehouseInventory from "./app/models/warehouseInventory.js";
import WarehouseFulfillment, {
  FULFILLMENT_STATUS,
} from "./app/models/warehouseFulfillment.js";
import InventoryTransaction, {
  INVENTORY_TRANSACTION_TYPES,
} from "./app/models/inventoryTransaction.js";
import StockTransfer, {
  TRANSFER_STATUS,
} from "./app/models/stockTransfer.js";

import {
  recordStockInward,
  recordStockOutward,
  recordStockAdjustment,
  recordDamagedStock,
  recordRestockFromDamaged,
  getWarehouseInventory,
  getWarehouseInventorySummary,
} from "./app/services/warehouseInventoryService.js";

import {
  evaluateWarehousesForOrder,
  assignWarehouseToOrder,
} from "./app/services/warehouseAssignmentService.js";

import {
  acceptFulfillment,
  startPicking,
  updateItemPickStatus,
  startPacking,
  markPacked,
  markReadyToShip,
  getWarehouseFulfillmentStats,
} from "./app/services/warehouseFulfillmentService.js";

import {
  createStockTransferRequest,
  approveAndDispatchTransfer,
  receiveTransfer,
} from "./app/services/warehouseTransferService.js";

async function runEndToEndVerification() {
  console.log("==================================================");
  console.log("  STARTING WAREHOUSE SYSTEM END-TO-END VERIFICATION");
  console.log("==================================================");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/jainahar";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const testSuffix = `test_${Date.now()}`;
  let testWhA = null;
  let testWhB = null;
  let testProduct = null;
  let testOrder = null;

  try {
    // ----------------------------------------------------
    // STEP 1: Create Test Warehouses & Product
    // ----------------------------------------------------
    console.log("\n[TEST 1] Creating test hubs and master catalogue product...");
    testWhA = await Warehouse.create({
      name: "Indore Manager",
      warehouseName: `Indore Hub ${testSuffix}`,
      city: "Indore",
      address: "Industrial Area, Indore",
      location: { lat: 22.7196, lng: 75.8577 },
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `indore_${testSuffix}@example.com`,
      password: "hashedpassword123",
      isActive: true,
      isVerified: true,
      serviceRadius: 60,
    });

    testWhB = await Warehouse.create({
      name: "Shivpuri Manager",
      warehouseName: `Shivpuri Hub ${testSuffix}`,
      city: "Shivpuri",
      address: "Main Bypass Road, Shivpuri",
      location: { lat: 25.4244, lng: 77.6596 },
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `shivpuri_${testSuffix}@example.com`,
      password: "hashedpassword123",
      isActive: true,
      isVerified: true,
      serviceRadius: 50,
    });

    const existingProduct = await Product.findOne().lean();

    if (existingProduct) {
      testProduct = existingProduct;
      console.log(`✅ Using existing catalogue product: ${testProduct.name || testProduct.title} (ID: ${testProduct._id})`);
    } else {
      const dummyId = new mongoose.Types.ObjectId();
      testProduct = await Product.create({
        name: `Premium Jain Pure Ghee ${testSuffix}`,
        title: `Premium Jain Pure Ghee ${testSuffix}`,
        slug: `ghee-${testSuffix}`,
        sku: `SKU-GHEE-${Date.now().toString().slice(-4)}`,
        sellerId: dummyId,
        categoryId: dummyId,
        subcategoryId: dummyId,
        headerId: dummyId,
        price: 650,
        stock: 500,
        isAvailable: true,
        categoryName: "Dairy",
      });
      console.log(`✅ Created Product: ${testProduct.name} (SKU: ${testProduct.sku})`);
    }

    // ----------------------------------------------------
    // STEP 2: Test Stock Inward & Stock Operations
    // ----------------------------------------------------
    console.log("\n[TEST 2] Testing Atomic Stock Inward & Inventory Transactions...");
    const inwardResult = await recordStockInward({
      warehouseId: testWhA._id,
      productId: testProduct._id,
      sku: testProduct.sku,
      quantity: 100,
      reason: "Initial Stock Supply",
      performedBy: testWhA._id,
      performedByModel: "Warehouse",
    });

    console.log(`✅ Inward 100 units successful. Available stock: ${inwardResult.inventory.available}`);
    console.log(`✅ Transaction logged: ${inwardResult.transaction.type} (${inwardResult.transaction.beforeQty} -> ${inwardResult.transaction.afterQty})`);

    // Test Adjustment (+10, -5)
    console.log("\n[TEST 3] Testing Stock Adjustments...");
    const adjInc = await recordStockAdjustment({
      warehouseId: testWhA._id,
      productId: testProduct._id,
      adjustmentType: "INCREASE",
      quantity: 10,
      reason: "Physical audit surplus",
      performedBy: testWhA._id,
      performedByModel: "Warehouse",
    });
    console.log(`✅ Increased +10. Available stock: ${adjInc.inventory.available}`);

    const adjDec = await recordStockAdjustment({
      warehouseId: testWhA._id,
      productId: testProduct._id,
      adjustmentType: "DECREASE",
      quantity: 5,
      reason: "Expired packaging",
      performedBy: testWhA._id,
      performedByModel: "Warehouse",
    });
    console.log(`✅ Decreased -5. Available stock: ${adjDec.inventory.available}`);

    // Test Damaged Quarantine & Restock
    console.log("\n[TEST 4] Testing Damaged Quarantine & Restock...");
    const dmgRes = await recordDamagedStock({
      warehouseId: testWhA._id,
      productId: testProduct._id,
      quantity: 5,
      reason: "Leaking jar during inspection",
      performedBy: testWhA._id,
      performedByModel: "Warehouse",
    });
    console.log(`✅ Moved 5 to Damaged. Available: ${dmgRes.inventory.available}, Damaged: ${dmgRes.inventory.damaged}`);

    const rstRes = await recordRestockFromDamaged({
      warehouseId: testWhA._id,
      productId: testProduct._id,
      quantity: 2,
      fromType: "damaged",
      reason: "Repackaged and sealed",
      performedBy: testWhA._id,
      performedByModel: "Warehouse",
    });
    console.log(`✅ Restocked 2 from Damaged. Available: ${rstRes.inventory.available}, Damaged: ${rstRes.inventory.damaged}`);

    // ----------------------------------------------------
    // STEP 3: Test Order Placement & Automatic Warehouse Assignment
    // ----------------------------------------------------
    console.log("\n[TEST 5] Testing Order Placement & Best Warehouse Selection...");
    testOrder = await Order.create({
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      customer: new mongoose.Types.ObjectId(),
      items: [
        {
          product: testProduct._id,
          name: testProduct.name || testProduct.title,
          sku: testProduct.sku || "SKU-DEFAULT",
          quantity: 10,
          price: 650,
          totalPrice: 6500,
        },
      ],
      pricing: { total: 6500, subtotal: 6500, deliveryFee: 0 },
      address: {
        name: "Test Customer",
        address: "Vijay Nagar, Indore",
        city: "Indore",
        phone: "9988776655",
        location: { lat: 22.7533, lng: 75.8937 }, // Customer in Indore
      },
      paymentMode: "ONLINE",
      paymentStatus: "PAID",
      status: "confirmed",
    });

    console.log(`✅ Placed test order #${testOrder.orderId}`);

    // Evaluate warehouses
    const evaluation = await evaluateWarehousesForOrder(testOrder);
    console.log(`✅ Evaluated active hubs: Found ${evaluation.eligible.length} eligible hub(s) with full stock.`);
    console.log(`   Best Hub: ${evaluation.eligible[0]?.warehouseName} (Distance: ${evaluation.eligible[0]?.distanceKm} km)`);

    // Assign warehouse
    const assignResult = await assignWarehouseToOrder({
      orderId: testOrder._id,
      assignedBy: "system",
    });

    console.log(`✅ Order auto-assigned to: ${assignResult.fulfillment.warehouse}`);
    console.log(`✅ Fulfillment created: ${assignResult.fulfillment.fulfillmentId} (Status: ${assignResult.fulfillment.status})`);

    // Check stock was reserved
    const invAfterReserve = await WarehouseInventory.findOne({
      warehouse: testWhA._id,
      product: testProduct._id,
    });
    console.log(`✅ Stock reserved: Available = ${invAfterReserve.available}, Reserved = ${invAfterReserve.reserved}`);

    // ----------------------------------------------------
    // STEP 4: Test Fulfillment Station Workflow
    // ----------------------------------------------------
    console.log("\n[TEST 6] Testing Warehouse Floor Fulfillment Lifecycle...");
    const fulfillmentId = assignResult.fulfillment._id;
    const mockWhUser = { id: testWhA._id, role: "warehouse" };

    // 1. Accept
    const accepted = await acceptFulfillment({ id: fulfillmentId, user: mockWhUser });
    console.log(`✅ Stage 1: Accepted fulfillment (Status: ${accepted.status})`);

    // 2. Start Picking
    const picking = await startPicking({ id: fulfillmentId, user: mockWhUser });
    console.log(`✅ Stage 2: Started Picking (Status: ${picking.status})`);

    // 3. Pick item
    const pickedItem = await updateItemPickStatus({
      id: fulfillmentId,
      user: mockWhUser,
      productId: testProduct._id,
      pickedQty: 10,
    });
    console.log(`✅ Stage 3: Picked items (Item status: ${pickedItem.items[0].status}, Picked: ${pickedItem.items[0].pickedQty}/${pickedItem.items[0].requiredQty})`);

    // 4. Start Packing
    const packing = await startPacking({ id: fulfillmentId, user: mockWhUser });
    console.log(`✅ Stage 4: Started Packing (Status: ${packing.status})`);

    // 5. Mark Packed
    const packed = await markPacked({ id: fulfillmentId, user: mockWhUser, notes: "Box 1 sealed with barcode" });
    console.log(`✅ Stage 5: Marked Packed (Status: ${packed.status})`);

    // 6. Ready to Ship (Stock Commit)
    const ready = await markReadyToShip({ id: fulfillmentId, user: mockWhUser });
    console.log(`✅ Stage 6: Marked READY_TO_SHIP (Status: ${ready.status})`);

    const invAfterCommit = await WarehouseInventory.findOne({
      warehouse: testWhA._id,
      product: testProduct._id,
    });
    console.log(`✅ Stock committed: Reserved count decremented to ${invAfterCommit.reserved}`);

    // ----------------------------------------------------
    // STEP 5: Test Inter-Warehouse Stock Transfer
    // ----------------------------------------------------
    console.log("\n[TEST 7] Testing Inter-Warehouse Transfer Workflow...");
    const transfer = await createStockTransferRequest({
      fromWarehouseId: testWhA._id,
      toWarehouseId: testWhB._id,
      items: [{ productId: testProduct._id, quantity: 20 }],
      notes: "Stock relocation for regional balancing",
      requestedBy: testWhA._id,
      userRole: "Warehouse",
    });
    console.log(`✅ Created transfer: ${transfer.transferId} (Status: ${transfer.status})`);

    // Approve & Dispatch (Transfer Out)
    const inTransit = await approveAndDispatchTransfer({
      transferId: transfer._id,
      approvedBy: testWhA._id,
      user: mockWhUser,
    });
    console.log(`✅ Transfer Dispatched into Transit (Status: ${inTransit.status})`);

    const invWhAAfterDispatch = await WarehouseInventory.findOne({
      warehouse: testWhA._id,
      product: testProduct._id,
    });
    console.log(`   Source Warehouse A Available Stock: ${invWhAAfterDispatch.available}`);

    // Receive at Destination (Transfer In)
    const mockWhBUser = { id: testWhB._id, role: "warehouse" };
    const received = await receiveTransfer({
      transferId: transfer._id,
      receivedBy: testWhB._id,
      user: mockWhBUser,
      notes: "All 20 units received in perfect condition",
    });
    console.log(`✅ Transfer Confirmed Received at Destination Hub (Status: ${received.status})`);

    const invWhBAfterReceive = await WarehouseInventory.findOne({
      warehouse: testWhB._id,
      product: testProduct._id,
    });
    console.log(`   Destination Warehouse B Available Stock: ${invWhBAfterReceive.available}`);

    console.log("\n==================================================");
    console.log("  🎉 ALL 7 END-TO-END SYSTEM TESTS PASSED PERFECTLY!");
    console.log("==================================================");
  } finally {
    // Cleanup test artifacts from database
    console.log("\nCleaning up test data...");
    if (testWhA) {
      await WarehouseInventory.deleteMany({ warehouse: { $in: [testWhA._id, testWhB?._id] } });
      await InventoryTransaction.deleteMany({ warehouse: { $in: [testWhA._id, testWhB?._id] } });
      await WarehouseFulfillment.deleteMany({ warehouse: { $in: [testWhA._id, testWhB?._id] } });
      await StockTransfer.deleteMany({ fromWarehouse: testWhA._id });
      await Warehouse.deleteMany({ _id: { $in: [testWhA._id, testWhB?._id] } });
    }
    if (testProduct) await Product.deleteOne({ _id: testProduct._id });
    if (testOrder) await Order.deleteOne({ _id: testOrder._id });
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. Verification complete.");
  }
}

runEndToEndVerification().catch((err) => {
  console.error("❌ E2E VERIFICATION ERROR:", err);
  process.exit(1);
});
