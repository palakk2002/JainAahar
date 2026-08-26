import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

function otpHashSecret() {
  return process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'secret123';
}

function hashOtp(identifier, otp) {
  return crypto
    .createHmac('sha256', otpHashSecret())
    .update(`${identifier}:${otp}`)
    .digest('hex');
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const { default: User } = await import('../app/models/customer.js');

  const emails = ['palakk2103@gmail.com', 'palakpatel0342@gmail.com'];

  for (const email of emails) {
    const norm = email.toLowerCase().trim();
    let user = await User.findOne({ email: norm });
    if (user) {
      user.otpHash = hashOtp(norm, '1234');
      user.otpExpiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000); // valid for 1 full year
      user.otpFailedAttempts = 0;
      user.otpLockedUntil = null;
      user.isVerified = true;
      user.isActive = true;
      // Also write legacy field just in case
      user.otp = '1234';
      user.otpExpiry = new Date(Date.now() + 365 * 24 * 3600 * 1000);
      await user.save();
      console.log('Saved 1234 OTP hash for:', norm, 'Hash:', user.otpHash);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
