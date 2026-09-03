import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const products = await Product.find({
      $or: [
        { name: { $regex: /badaam|almond|kaju/i } },
        { weight: { $regex: /100\s*kg/i } }
      ]
    });
    console.log("Found products:", JSON.stringify(products.map(p => ({
      _id: p._id,
      name: p.name,
      weight: p.weight,
      price: p.price,
      salePrice: p.salePrice
    })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
