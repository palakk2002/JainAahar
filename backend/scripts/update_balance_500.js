import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../app/models/customer.js';
import Wallet from '../app/models/wallet.js';
import { OWNER_TYPE } from '../app/constants/finance.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne().sort({ updatedAt: -1 });
  if (user) {
    user.walletBalance = 500;
    await user.save();

    await Wallet.findOneAndUpdate(
      { ownerType: OWNER_TYPE.CUSTOMER, ownerId: user._id },
      { $set: { availableBalance: 500 } }
    );
    console.log('Successfully set user walletBalance to 500 for:', user._id);
  }
  await mongoose.disconnect();
}

run().catch(console.error);
