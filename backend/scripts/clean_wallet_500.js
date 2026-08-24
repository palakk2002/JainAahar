import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../app/models/customer.js';
import Wallet from '../app/models/wallet.js';
import Transaction from '../app/models/transaction.js';
import LedgerEntry from '../app/models/ledgerEntry.js';
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

    // Remove old test transactions and leave single 500 Rs transaction
    await Transaction.deleteMany({
      $or: [{ user: user._id }, { 'meta.customerId': user._id }],
    });

    await LedgerEntry.deleteMany({
      actorId: user._id,
      actorType: OWNER_TYPE.CUSTOMER,
    });

    const reference = 'W-TOPUP-' + Date.now();
    await Transaction.create({
      user: user._id,
      userModel: 'User',
      type: 'Wallet Topup',
      amount: 500,
      status: 'Settled',
      reference,
      date: new Date(),
      createdAt: new Date(),
      meta: { source: 'online_topup' },
    });

    console.log('Successfully cleaned DB and set single 500 Rs transaction for user:', user._id);
  }
  await mongoose.disconnect();
}

run().catch(console.error);
