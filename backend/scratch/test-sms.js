import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

async function testSMS() {
  const url = process.env.SMS_INDIA_HUB_URL || "https://login.bulksmssender.in/app/smsapi/index.php";
  const apiKey = process.env.SMS_INDIA_HUB_API_KEY;
  const senderId = process.env.SMS_INDIA_HUB_SENDER_ID;
  const campaign = process.env.SMS_CAMPAIGN_ID || "12719";
  const routeid = process.env.SMS_ROUTE_ID || "100768";
  const templateId = process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID;
  const peId = process.env.SMS_INDIA_HUB_PE_ID;

  console.log("Config:", { url, apiKey: apiKey ? apiKey.slice(0, 6) + "..." : null, senderId, campaign, routeid, templateId, peId });

  const params = {
    key: apiKey,
    campaign: campaign,
    routeid: routeid,
    type: "text",
    contacts: "8770620342",
    senderid: senderId,
    msg: "Hi Ankit, your Jain Aahar signup verification code is 1234 . Enter this code to complete your signup. If you didnt request this, please ignore this message. - Jain Aahar Team JAINA ENTERPRISES",
    ...(templateId ? { template_id: templateId } : {}),
    ...(peId ? { pe_id: peId } : {}),
  };

  console.log("Request params:", params);

  try {
    const res = await axios.get(url, { params });
    console.log("Response status:", res.status);
    console.log("Response data:", res.data);
  } catch (err) {
    console.error("Axios error:", err.response ? err.response.data : err.message);
  }
}

testSMS();
