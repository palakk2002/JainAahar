import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../app/models/customer.js';
import Notification from '../app/models/notification.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find();
  console.log(`Found ${users.length} users in DB`);

  for (const user of users) {
    // Delete previous notifications
    await Notification.deleteMany({
      $or: [{ recipient: user._id }, { userId: user._id }],
    });

    const notifs = [
      {
        recipient: user._id,
        recipientModel: 'User',
        userId: user._id,
        role: 'customer',
        title: '₹500 Added to Wallet 💳',
        message: 'Your wallet top-up of ₹500 was successful. Current available balance is ₹500.',
        body: 'Your wallet top-up of ₹500 was successful. Current available balance is ₹500.',
        type: 'payment',
        status: 'sent',
        channel: 'in_app',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      },
      {
        recipient: user._id,
        recipientModel: 'User',
        userId: user._id,
        role: 'customer',
        title: 'Order Delivered Successfully 📦',
        message: 'Your order #ORD450 has been safely delivered to your address. Enjoy your fresh meal!',
        body: 'Your order #ORD450 has been safely delivered to your address. Enjoy your fresh meal!',
        type: 'order',
        status: 'sent',
        channel: 'in_app',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
      },
      {
        recipient: user._id,
        recipientModel: 'User',
        userId: user._id,
        role: 'customer',
        title: 'Special 20% Off on Jain Groceries ✨',
        message: 'Use coupon code JAINSPECIAL to get 20% discount on all Sattvik and Paryushan special items.',
        body: 'Use coupon code JAINSPECIAL to get 20% discount on all Sattvik and Paryushan special items.',
        type: 'alert',
        status: 'sent',
        channel: 'in_app',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000), // 5 hours ago
      },
    ];

    await Notification.insertMany(notifs);
  }

  console.log('Successfully seeded 3 notifications for all users!');
  await mongoose.disconnect();
}

run().catch(console.error);
