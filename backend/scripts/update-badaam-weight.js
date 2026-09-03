import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // Update badaam product
    const result = await Product.updateOne(
      { _id: new mongoose.Types.ObjectId("6a96c50ffb430ebd8f64d3b2") },
      { $set: { weight: "500 g" } }
    );
    console.log("Update result for badaam:", result);

    const updated = await Product.findById("6a96c50ffb430ebd8f64d3b2");
    console.log("Updated badaam product:", {
      _id: updated._id,
      name: updated.name,
      weight: updated.weight,
      price: updated.price,
      salePrice: updated.salePrice
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
