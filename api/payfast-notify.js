import crypto from "crypto";
import { Resend } from "resend";
import { sendToProdigi } from "../lib/prodigi.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// Prevent duplicate orders
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

    // 🌍 DETECT COUNTRY
    const country =
      req.headers["x-vercel-ip-country"] ||
      body.custom_str7 ||
      "UNKNOWN";

    console.log("🌍 Country:", country);

    let result;
    let providerUsed;

    // =========================
    // 🇿🇦 PRODIGI (PRIMARY FOR SA)
    // =========================
    if (country === "ZA") {
      try {
        console.log("Using PRODIGI 🇿🇦");

        // 🔥 BUILD PRODIGI ORDER
        const prodigiOrder = {
          email: body.email_address,
          shipping: {
            firstName: body.name_first,
            lastName: body.name_last,
            address1: body.custom_str3,
            city: body.custom_str4,
            zip: body.custom_str6,
            country: body.custom_str7
          },
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            prodigiSku: item.prodigiSku,
            designUrl: item.designUrl,
            printArea: item.printArea || "front"
          }))
        };

        result = await sendToProdigi(prodigiOrder);
        providerUsed = "PRODIGI";

      } catch (err) {
        console.log("❌ Prodigi failed → fallback Printify");

        result = await sendToPrintify(body, cart);
        providerUsed = "PRINTIFY_FALLBACK";
      }

    } else {
      // =========================
      // 🌍 PRINTIFY (DEFAULT)
      // =========================
      try {
        console.log("Using PRINTIFY 🌍");

        result = await sendToPrintify(body, cart);
        providerUsed = "PRINTIFY";

      } catch (err) {
        console.log("❌ Printify failed → fallback Prodigi");

        const prodigiOrder = {
          email: body.email_address,
          shipping: {
            firstName: body.name_first,
            lastName: body.name_last,
            address1: body.custom_str3,
            city: body.custom_str4,
            zip: body.custom_str6,
            country: body.custom_str7
          },
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            prodigiSku: item.prodigiSku,
            designUrl: item.designUrl,
            printArea: item.printArea || "front"
          }))
        };

        result = await sendToProdigi(prodigiOrder);
        providerUsed = "PRODIGI_FALLBACK";
      }
    }

    // ✉️ EMAIL
    try {
      await resend.emails.send({
        from: "Lunara <onboarding@resend.dev>",
        to: body.email_address,
        subject: "🌙 Your Lunara Order is Confirmed",
        html: `<p>Your order is being processed via ${providerUsed}</p>`
      });
    } catch (e) {
      console.error("Email failed:", e);
    }

    return res.status(200).send("Order processed");

  } catch (err) {
    return res.status(500).send("Server error: " + err.message);
  }
}

// 🔥 PRINTIFY FUNCTION (EXTRACTED)
async function sendToPrintify(body, cart) {
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
    throw new Error("Printify failed");
  }

  return response.json();
          }
