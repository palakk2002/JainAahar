import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const products = await Product.find({ weight: { $exists: true, $ne: null } }).limit(20);
    console.log("Sample weights:", products.map(p => ({ name: p.name, weight: p.weight })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
