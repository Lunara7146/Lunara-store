import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Prevent duplicate orders (basic memory cache)
const processedOrders = new Set();

// --- HELPERS ---
function encodeValue(value = "") {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

function buildSignatureString(data, passphrase = "") {
  const keys = Object.keys(data)
    .filter(k => k !== "signature" && data[k] !== "" && data[k] !== undefined)
    .sort();

  let str = keys.map(k => `${k}=${encodeValue(data[k])}`).join("&");

  if (passphrase) {
    str += `&passphrase=${encodeValue(passphrase)}`;
  }

  return str;
}

function generateSignature(data, passphrase = "") {
  return crypto
    .createHash("md5")
    .update(buildSignatureString(data, passphrase))
    .digest("hex");
}

// --- MAIN ---
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    // 🔐 VERIFY SIGNATURE
    const receivedSig = (body.signature || "").toLowerCase();
    const expectedSig = generateSignature(body, passphrase).toLowerCase();

    if (!receivedSig || receivedSig !== expectedSig) {
      return res.status(400).send("Invalid signature");
    }

    // ❌ Ignore unpaid
    if (body.payment_status !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    // ❌ Prevent duplicate processing
    if (processedOrders.has(body.m_payment_id)) {
      return res.status(200).send("Already processed");
    }
    processedOrders.add(body.m_payment_id);

    // 🛒 PARSE CART
    let cart = [];
    try {
      cart = JSON.parse(body.custom_str1 || "[]");
    } catch {
      return res.status(400).send("Invalid cart");
    }

    if (!cart.length) {
      return res.status(400).send("Empty cart");
    }

    // 📦 BUILD PRINTIFY ITEMS
    const line_items = cart.map(item => ({
      product_id: item.productId,
      variant_id: Number(item.variantId),
      quantity: Number(item.quantity || 1)
    }));

    const orderPayload = {
      external_id: body.m_payment_id,
      line_items,
      address_to: {
        first_name: body.name_first,
        last_name: body.name_last,
        email: body.email_address,
        phone: body.custom_str8,
        country: body.custom_str7,
        region: body.custom_str5,
        address1: body.custom_str3,
        city: body.custom_str4,
        zip: body.custom_str6
      },
      shipping_method: 1,
      send_shipping_notification: true
    };

    // 🚀 SEND TO PRINTIFY
    const response = await fetch(
      `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderPayload)
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).send("Printify error: " + err);
    }

    // ✉️ SEND EMAIL (SAFE)
    try {
      await resend.emails.send({
        from: "Lunara <onboarding@resend.dev>",
        to: body.email_address,
        subject: "🌙 Your Lunara Order is Confirmed",
        html: `
          <div style="font-family: Arial; padding:20px;">
            <h2>Order Confirmed 🌙</h2>

            <p>Hi ${body.name_first},</p>

            <p>Your order is officially being processed.</p>

            <p><strong>Order ID:</strong> ${body.m_payment_id}</p>

            <p>You’ll receive tracking details once shipped.</p>

            <br>

            <a href="https://lunara-store-tau.vercel.app/track.html?orderId=${body.m_payment_id}"
              style="background:#b98cff;padding:12px 20px;color:#000;text-decoration:none;border-radius:8px;">
              Track Order
            </a>

            <p style="margin-top:30px;">– Lunara</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Email failed:", emailError);
    }

    return res.status(200).send("Order processed");

  } catch (err) {
    return res.status(500).send("Server error: " + err.message);
  }
}
