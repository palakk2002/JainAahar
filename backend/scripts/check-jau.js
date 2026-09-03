import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    const cats = await Category.find({ name: { $regex: /jau|kaju|barley/i } });
    console.log("Categories matching jau/kaju/barley:", cats.map(c => ({ name: c.name, type: c.type })));
    
    const prods = await Product.find({ name: { $regex: /jau|kaju/i } });
    console.log("Products matching jau/kaju:", prods.map(p => ({ name: p.name, price: p.price, salePrice: p.salePrice })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
