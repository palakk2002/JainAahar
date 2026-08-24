/**
 * Migration Script: Fix User and Admin Unique Indexes
 * 
 * Drops legacy non-partial unique indexes (phone_1, email_1) on the `users` and `admins` collections,
 * cleans up any explicit null fields, and builds partial unique indexes.
 * 
 * Safe and Idempotent.
 * 
 * USAGE:
 *   node backend/scripts/fix-user-indexes.js
 */

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Ignore if custom DNS servers cannot be set
}

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../app/dbConfig/dbConfig.js";
import User from "../app/models/customer.js";
import Admin from "../app/models/admin.js";

dotenv.config();

async function run() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  const db = mongoose.connection.db;

  console.log("\n1. Cleaning up users collection...");
  const usersCollection = db.collection("users");
  
  // Unset any explicit nulls
  const phoneUnsetRes = await usersCollection.updateMany({ phone: null }, { $unset: { phone: "" } });
  const emailUnsetRes = await usersCollection.updateMany({ email: null }, { $unset: { email: "" } });
  console.log(`Unset null phones: ${phoneUnsetRes.modifiedCount}, unset null emails: ${emailUnsetRes.modifiedCount}`);

  // Fetch current indexes
  const userIndexes = await usersCollection.indexes();
  console.log("Current user indexes:", userIndexes.map(i => i.name));

  for (const idx of userIndexes) {
    if (idx.name === "_id_") continue;
    // Drop old phone_1 or idx_phone if not partial
    if ((idx.name === "phone_1" || idx.name === "idx_phone") && (!idx.partialFilterExpression || !idx.partialFilterExpression.phone)) {
      console.log(`Dropping old index on users: ${idx.name}`);
      await usersCollection.dropIndex(idx.name);
    }
    // Drop old email_1 or idx_email if not partial
    if ((idx.name === "email_1" || idx.name === "idx_email") && (!idx.partialFilterExpression || !idx.partialFilterExpression.email)) {
      console.log(`Dropping old index on users: ${idx.name}`);
      await usersCollection.dropIndex(idx.name);
    }
  }

  console.log("Rebuilding User model indexes with partialFilterExpression...");
  await User.createIndexes();

  const newUserIndexes = await usersCollection.indexes();
  console.log("Updated user indexes:");
  for (const idx of newUserIndexes) {
    console.log(`  - ${idx.name}: key=${JSON.stringify(idx.key)} sparse=${!!idx.sparse} partial=${JSON.stringify(idx.partialFilterExpression || null)}`);
  }

  console.log("\n2. Cleaning up admins collection...");
  const adminsCollection = db.collection("admins");
  await adminsCollection.updateMany({ phone: null }, { $unset: { phone: "" } });
  const adminIndexes = await adminsCollection.indexes();
  for (const idx of adminIndexes) {
    if (idx.name === "phone_1" && (!idx.partialFilterExpression || !idx.partialFilterExpression.phone)) {
      console.log(`Dropping old index on admins: ${idx.name}`);
      await adminsCollection.dropIndex(idx.name);
    }
  }
  await Admin.createIndexes();
  const newAdminIndexes = await adminsCollection.indexes();
  console.log("Updated admin indexes:");
  for (const idx of newAdminIndexes) {
    console.log(`  - ${idx.name}: key=${JSON.stringify(idx.key)} sparse=${!!idx.sparse} partial=${JSON.stringify(idx.partialFilterExpression || null)}`);
  }

  console.log("\n3. Checking phantom customers collection...");
  const customersExists = await db.listCollections({ name: "customers" }, { nameOnly: true }).hasNext();
  if (customersExists) {
    const count = await db.collection("customers").estimatedDocumentCount();
    if (count === 0) {
      await db.collection("customers").drop();
      console.log("Dropped empty phantom `customers` collection");
    }
  }

  console.log("\n=== Migration Completed Successfully ===");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
