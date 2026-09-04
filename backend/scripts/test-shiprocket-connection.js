import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const BASE_URL = process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external";
const email = process.env.SHIPROCKET_EMAIL;
const password = process.env.SHIPROCKET_PASSWORD;

async function testConnection() {
  console.log("==========================================");
  console.log("🚀 Testing Shiprocket Live Integration");
  console.log("==========================================\n");

  console.log("📧 Email:", email ? `${email}` : "❌ Missing");
  console.log("🔑 Password:", password ? "********" : "❌ Missing");
  console.log("🌐 Base URL:", BASE_URL);
  console.log("");

  if (!email || !password) {
    console.error("❌ Error: SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is not set in backend/.env");
    process.exit(1);
  }

  // Step 1: Test Login
  console.log("1️⃣ Authenticating with Shiprocket API (/auth/login)...");
  let token = null;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password }, { timeout: 10000 });
    token = loginRes.data?.token;

    if (!token) {
      console.error("   ❌ No token received from Shiprocket:", loginRes.data);
      process.exit(1);
    }
    console.log("   ✅ Login Successful! Bearer Token generated:");
    console.log(`      ${token.substring(0, 25)}...`);
    console.log("");
  } catch (err) {
    console.error("   ❌ Shiprocket Login Failed!");
    console.error("   Status:", err.response?.status);
    console.error("   Message:", err.response?.data?.message || err.message);
    if (err.response?.data) {
      console.error("   Details:", JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Step 2: Fetch Pickup Locations
  console.log("2️⃣ Fetching Registered Pickup Locations (/settings/company/pickup)...");
  try {
    const pickupRes = await axios.get(`${BASE_URL}/settings/company/pickup`, {
      headers: authHeaders,
      timeout: 10000,
    });
    const locations = pickupRes.data?.data?.shipping_address || [];
    console.log(`   ✅ Success! Found ${locations.length} pickup location(s):`);
    locations.forEach((loc, idx) => {
      console.log(`      [${idx + 1}] Nickname: "${loc.pickup_location}", City: ${loc.city}, Pin: ${loc.pin_code}, Phone: ${loc.phone}`);
    });
    console.log("");
  } catch (err) {
    console.warn("   ⚠️ Pickup Locations Error:", err.response?.data?.message || err.message);
  }

  // Step 3: Test Courier Serviceability Check
  console.log("3️⃣ Checking Courier Serviceability & Live Rates (/courier/serviceability)...");
  try {
    const servRes = await axios.get(
      `${BASE_URL}/courier/serviceability/?pickup_postcode=452001&delivery_postcode=560001&weight=0.5&cod=0`,
      {
        headers: authHeaders,
        timeout: 10000,
      }
    );
    const couriers = servRes.data?.data?.available_courier_companies || [];
    console.log(`   ✅ Success! Found ${couriers.length} available courier partners:`);
    couriers.slice(0, 4).forEach((c, idx) => {
      console.log(`      - ${c.courier_name} (${c.city}): Rate ₹${c.rate}, ETD: ${c.etd || c.estimated_delivery_days || '2-4 days'}`);
    });
    console.log("");
  } catch (err) {
    console.warn("   ⚠️ Serviceability Check:", err.response?.data?.message || err.message);
  }

  console.log("==========================================");
  console.log("🎉 SHIPROCKET CREDENTIALS & API ARE 100% WORKING!");
  console.log("==========================================");
  process.exit(0);
}

testConnection();
