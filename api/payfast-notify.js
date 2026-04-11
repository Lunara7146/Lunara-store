import crypto from "crypto";
import { Resend } from "resend";
import { sendToProdigi } from "../lib/prodigi.js";
import { supabase } from "../lib/supabase.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ NOTE: This resets on server restart (OK for now)
const processedOrders = new Set();

// ==========================
// 🔐 SIGNATURE HELPERS
// ==========================
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

// ==========================
// 🚀 MAIN HANDLER
// ==========================
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    // ==========================
    // 🔐 VERIFY SIGNATURE
    // ==========================
    const receivedSig = (body.signature || "").toLowerCase();
    const expectedSig = generateSignature(body, passphrase).toLowerCase();

    if (!receivedSig || receivedSig !== expectedSig) {
      console.error("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    // ==========================
    // ❌ IGNORE UNPAID
    // ==========================
    if (body.payment_status !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    const orderId = body.m_payment_id;

    // ==========================
    // ❌ DUPLICATE PREVENTION
    // ==========================
    if (processedOrders.has(orderId)) {
      return res.status(200).send("Already processed");
    }
    processedOrders.add(orderId);

    // ==========================
    // 🧠 LOAD ORDER FROM SUPABASE
    // ==========================
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (fetchError || !orderData) {
      console.error("❌ Order not found in DB");
      return res.status(404).send("Order not found");
    }

    const cart = orderData.cart || [];

    if (!cart.length) {
      return res.status(400).send("Empty cart");
    }

    const customer = orderData.customer || {};

    // ==========================
    // 🌍 COUNTRY DETECTION
    // ==========================
    const country =
      req.headers["x-vercel-ip-country"] ||
      customer.country ||
      "UNKNOWN";

    console.log("🌍 Country:", country);

    let result;
    let providerUsed;

    // ==========================
    // 🇿🇦 PRODIGI FIRST
    // ==========================
    if (country === "ZA") {
      try {
        console.log("Using PRODIGI 🇿🇦");

        const prodigiOrder = {
          email: orderData.email,
          shipping: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            address1: customer.address1,
            city: customer.city,
            zip: customer.zip,
            country: customer.country
          },
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            prodigiSku: item.prodigi?.sku,
            designUrl: item.prodigi?.designUrl,
            printArea: item.prodigi?.printArea || "front"
          }))
        };

        result = await sendToProdigi(prodigiOrder);
        providerUsed = "PRODIGI";

      } catch (err) {
        console.error("❌ Prodigi failed → fallback Printify");

        result = await sendToPrintify(orderData);
        providerUsed = "PRINTIFY_FALLBACK";
      }

    } else {
      // ==========================
      // 🌍 PRINTIFY DEFAULT
      // ==========================
      try {
        console.log("Using PRINTIFY 🌍");

        result = await sendToPrintify(orderData);
        providerUsed = "PRINTIFY";

      } catch (err) {
        console.error("❌ Printify failed → fallback Prodigi");

        const prodigiOrder = {
          email: orderData.email,
          shipping: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            address1: customer.address1,
            city: customer.city,
            zip: customer.zip,
            country: customer.country
          },
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            prodigiSku: item.prodigi?.sku,
            designUrl: item.prodigi?.designUrl,
            printArea: item.prodigi?.printArea || "front"
          }))
        };

        result = await sendToProdigi(prodigiOrder);
        providerUsed = "PRODIGI_FALLBACK";
      }
    }

    // ==========================
    // 🧠 UPDATE ORDER STATUS
    // ==========================
    await supabase
      .from("orders")
      .update({
        status: "paid",
        provider: providerUsed,
        fulfillment_response: result
      })
      .eq("order_id", orderId);

    // ==========================
    // ✉️ EMAIL CONFIRMATION
    // ==========================
    try {
      await resend.emails.send({
        from: "Lunara <onboarding@resend.dev>",
        to: orderData.email,
        subject: "🌙 Your Lunara Order is Confirmed",
        html: `
          <h2>Order Confirmed</h2>
          <p>Order ID: ${orderId}</p>
          <p>Provider: ${providerUsed}</p>
          <p>Your order is now being processed.</p>
        `
      });
    } catch (e) {
      console.error("Email failed:", e);
    }

    return res.status(200).send("Order processed");

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return res.status(500).send("Server error: " + err.message);
  }
}

// ==========================
// 🖨️ PRINTIFY FUNCTION
// ==========================
async function sendToPrintify(orderData) {

  const cart = orderData.cart || [];
  const customer = orderData.customer || {};

  const line_items = cart.map(item => ({
    product_id: item.printify?.productId,
    variant_id: Number(item.printify?.variantId),
    quantity: Number(item.quantity || 1)
  }));

  const orderPayload = {
    external_id: orderData.order_id,
    line_items,
    address_to: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: orderData.email,
      phone: customer.phone,
      country: customer.country,
      region: customer.region,
      address1: customer.address1,
      city: customer.city,
      zip: customer.zip
    },
    shipping_method: 1,
    send_shipping_notification: true
  };

  const response = await fetch(
    `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderPayload)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Printify error:", data);
    throw new Error("Printify failed");
  }

  return data;
}
