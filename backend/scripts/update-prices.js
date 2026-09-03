import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Redis from 'ioredis';
dotenv.config();

const itemsToUpdate = [
  { id: "6a96c50ffb430ebd8f64d3b2", name: "badaam", newPrice: 364 },
  { id: "6a96c4c5fb430ebd8f64d398", name: "kaju", newPrice: 785 },
  { id: "6a96be042c86214b0bd56724", name: "corn", newPrice: 85 },
  { id: "6a96bdc32c86214b0bd5670f", name: "Rice", newPrice: 115 },
  { id: "6a96bd842c86214b0bd566fa", name: "Moong dal", newPrice: 140 },
  { id: "6a96bd562c86214b0bd566e5", name: "Toor Dal", newPrice: 130 },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

    console.log("Updating product prices in MongoDB...");
    for (const item of itemsToUpdate) {
      const prod = await Product.findById(item.id);
      if (!prod) {
        console.warn(`Product not found for ID: ${item.id} (${item.name})`);
        continue;
      }

      const updatedVariants = (prod.variants || []).map((v) => ({
        ...v,
        price: item.newPrice,
        salePrice: item.newPrice,
      }));

      // If product has no variants, or has default variant
      if (updatedVariants.length === 0) {
        updatedVariants.push({
          name: "Default",
          price: item.newPrice,
          salePrice: item.newPrice,
          stock: prod.stock || 50,
          sku: prod.sku || `SKU-${Date.now()}`
        });
      }

      await Product.updateOne(
        { _id: prod._id },
        {
          $set: {
            price: item.newPrice,
            salePrice: item.newPrice,
            variants: updatedVariants
          }
        }
      );

      console.log(`✓ Updated "${prod.name}": Price = ₹${item.newPrice}`);
    }

    // Flush Redis cache if REDIS_URL exists
    if (process.env.REDIS_URL) {
      try {
        const redis = new Redis(process.env.REDIS_URL, { connectTimeout: 3000, lazyConnect: true });
        await redis.connect();
        await redis.flushdb();
        await redis.quit();
        console.log("✓ Redis cache flushed successfully");
      } catch (redisErr) {
        console.warn("Redis flush skipped/failed:", redisErr.message);
      }
    }

    // Verify all
    console.log("\n--- Verification ---");
    for (const item of itemsToUpdate) {
      const p = await Product.findById(item.id).lean();
      console.log(`Product: ${p.name.padEnd(12)} | Price: ₹${p.price} | SalePrice: ₹${p.salePrice} | Weight: ${p.weight || 'N/A'}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error updating prices:", err);
    process.exit(1);
  }
}

run();
