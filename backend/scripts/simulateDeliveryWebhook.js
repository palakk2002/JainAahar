import axios from "axios";
import crypto from "crypto";

const PORT = process.env.PORT || 7000;
const URL = `http://localhost:${PORT}/api/delivery/webhook`;

async function simulate(provider = "shiprocket", orderId = "ORD-TEST-001", status = "OUT FOR DELIVERY") {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET || "test-secret";
  const payload = {
    order_id: orderId,
    awb_code: `AWB-${Date.now()}`,
    current_status: status,
    location: "Bengaluru Hub",
    timestamp: new Date().toISOString(),
  };

  const bodyStr = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", secret).update(bodyStr).digest("hex");

  console.log(`Sending simulated ${provider} webhook for order: ${orderId}...`);

  try {
    const res = await axios.post(`${URL}/${provider}`, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-shiprocket-signature": secret,
        "x-shiprocket-hmac-sha256": sig,
      },
    });

    console.log("Webhook Response:", res.status, res.data);
  } catch (err) {
    console.error("Webhook Simulation Failed:", err.response?.status, err.response?.data || err.message);
  }
}

const provider = process.argv[2] || "shiprocket";
const orderId = process.argv[3] || "ORD-TEST-001";
const status = process.argv[4] || "OUT FOR DELIVERY";

simulate(provider, orderId, status);
