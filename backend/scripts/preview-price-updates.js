import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const priceUpdates = [
  { match: /badaam/i, targetPrice: 364, name: "badaam" },
  { match: /kaju/i, targetPrice: 785, name: "kaju" },
  { match: /corn/i, targetPrice: 85, name: "corn" },
  { match: /rice/i, targetPrice: 115, name: "rice" },
  { match: /moong\s*dal/i, targetPrice: 140, name: "moong dal" },
  { match: /toor\s*dal/i, targetPrice: 130, name: "toor dal" },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    for (const item of priceUpdates) {
      const prods = await Product.find({ name: { $regex: item.match } });
      console.log(`Matching for "${item.name}":`, prods.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        salePrice: p.salePrice,
        variants: p.variants
      })));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
