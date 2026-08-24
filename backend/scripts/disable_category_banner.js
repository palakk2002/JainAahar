import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Setting = mongoose.connection.db.collection('settings');
  await Setting.updateOne(
    {},
    {
      $set: {
        'categoriesBanner.isVisible': false,
        'categoriesBanner.image': '',
      },
    }
  );
  console.log('Disabled categoriesBanner in database successfully!');
  await mongoose.disconnect();
}

run().catch(console.error);
