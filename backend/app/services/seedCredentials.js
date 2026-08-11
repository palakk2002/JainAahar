import User from "../models/customer.js";
import Admin from "../models/admin.js";
import Seller from "../models/seller.js";
import logger from "./logger.js";

export async function ensureDefaultCredentials() {
  try {
    logger.info("[Seed] Ensuring default credentials for modules...");

    // 1. Customer: +919111966732
    const customerPhone = "+919111966732";
    let customer = await User.findOne({ phone: customerPhone });
    if (!customer) {
      customer = new User({
        name: "Palak Patel Customer",
        phone: customerPhone,
        isVerified: true,
        isActive: true,
      });
      await customer.save();
      logger.info(`[Seed] Created Customer with phone: ${customerPhone}`);
    } else {
      let modified = false;
      if (!customer.isVerified) {
        customer.isVerified = true;
        modified = true;
      }
      if (!customer.isActive) {
        customer.isActive = true;
        modified = true;
      }
      if (modified) {
        await customer.save();
        logger.info(`[Seed] Updated Customer status with phone: ${customerPhone}`);
      }
    }

    // 2. Admin: palakpatel0342@gmail.com / 123456
    const adminEmail = "palakpatel0342@gmail.com";
    let admin = await Admin.findOne({ email: adminEmail }).select("+password");
    if (!admin) {
      admin = new Admin({
        name: "Palak Patel Admin",
        email: adminEmail,
        password: "123456",
        role: "admin",
        isVerified: true,
      });
      await admin.save();
      logger.info(`[Seed] Created Admin with email: ${adminEmail}`);
    } else {
      let modified = false;
      const isMatch = await admin.comparePassword("123456");
      if (!isMatch) {
        admin.password = "123456";
        modified = true;
      }
      if (!admin.isVerified) {
        admin.isVerified = true;
        modified = true;
      }
      if (admin.role !== "admin") {
        admin.role = "admin";
        modified = true;
      }
      if (modified) {
        await admin.save();
        logger.info(`[Seed] Reset/Updated Admin credentials: ${adminEmail}`);
      }
    }

    // 3. Seller: palakpatel0342@gmail.com / 123456
    const sellerEmail = "palakpatel0342@gmail.com";
    const sellerPhone = "9111966732";
    let seller = await Seller.findOne({ email: sellerEmail }).select("+password");
    if (!seller) {
      seller = new Seller({
        name: "Palak Patel Seller",
        email: sellerEmail,
        phone: sellerPhone,
        password: "123456",
        shopName: "Palak Shop",
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        applicationStatus: "approved",
        isActive: true,
      });
      await seller.save();
      logger.info(`[Seed] Created Seller with email: ${sellerEmail}`);
    } else {
      let modified = false;
      const isMatch = await seller.comparePassword("123456");
      if (!isMatch) {
        seller.password = "123456";
        modified = true;
      }
      if (seller.phone !== sellerPhone) {
        seller.phone = sellerPhone;
        modified = true;
      }
      if (!seller.isVerified) {
        seller.isVerified = true;
        modified = true;
      }
      if (!seller.emailVerified) {
        seller.emailVerified = true;
        modified = true;
      }
      if (!seller.phoneVerified) {
        seller.phoneVerified = true;
        modified = true;
      }
      if (seller.applicationStatus !== "approved") {
        seller.applicationStatus = "approved";
        modified = true;
      }
      if (!seller.isActive) {
        seller.isActive = true;
        modified = true;
      }
      if (modified) {
        await seller.save();
        logger.info(`[Seed] Reset/Updated Seller credentials: ${sellerEmail}`);
      }
    }

    logger.info("[Seed] Default credentials ensured successfully.");
  } catch (error) {
    logger.error("[Seed] Error ensuring default credentials:", error);
  }
}
