import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const allProducts = await Product.find({}, '_id name price salePrice variants weight stock').lean();
    console.log("All products count:", allProducts.length);
    for (const p of allProducts) {
      console.log(`- ID: ${p._id}, Name: "${p.name}", Weight: "${p.weight}", Price: ${p.price}, SalePrice: ${p.salePrice}, Variants: ${JSON.stringify(p.variants)}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
