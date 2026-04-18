import crypto from "crypto";
import { Resend } from "resend";
import { sendToProdigi } from "../lib/prodigi.js";
import { supabase } from "../lib/supabase.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const processedOrders = new Set();

// ==========================
// 🔐 SIGNATURE
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
// 🚀 MAIN
// ==========================
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    const receivedSig = (body.signature || "").toLowerCase();
    const expectedSig = generateSignature(body, passphrase).toLowerCase();

    if (!receivedSig || receivedSig !== expectedSig) {
      return res.status(400).send("Invalid signature");
    }

    if (body.payment_status !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    const orderId = body.m_payment_id;

    if (processedOrders.has(orderId)) {
      return res.status(200).send("Already processed");
    }
    processedOrders.add(orderId);

    // ==========================
    // 🧠 LOAD ORDER
    // ==========================
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    const cart = orderData.cart || [];
    const customer = orderData.customer || {};

    const country =
      req.headers["x-vercel-ip-country"] ||
      customer.country ||
      "UNKNOWN";

    const isSA = country === "ZA";

    // ==========================
    // 🧠 SPLIT CART (UPDATED)
    // ==========================
    const prodigiItems = cart.filter(item =>
      isSA &&
      (item.type === "hoodie" || item.type === "tshirt") &&
      item.prodigi?.prodigiSkuMap
    );

    const printifyItems = cart.filter(item =>
      !(isSA &&
        (item.type === "hoodie" || item.type === "tshirt") &&
        item.prodigi?.prodigiSkuMap)
    );

    let results = [];

    // ==========================
    // 🇿🇦 PRODIGI (FIXED)
    // ==========================
    if (prodigiItems.length) {
      try {

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
          items: prodigiItems.map(item => {

            const size = item.size;
            const color = item.color;

            const sku =
              item.prodigi?.prodigiSkuMap?.[color]?.[size];

            const designUrl =
              item.prodigi?.designUrlMap?.[color] ||
              item.designUrl;

            if (!sku) {
              throw new Error(`Missing SKU for ${color} ${size}`);
            }

            return {
              name: item.name,
              quantity: item.quantity,
              prodigiSku: sku,
              designUrl,
              printArea: item.prodigi?.printArea || "front"
            };
          })
        };

        const result = await sendToProdigi(prodigiOrder);
        results.push({ provider: "PRODIGI", result });

      } catch (err) {
        console.error("❌ Prodigi failed → fallback to Printify", err);
        printifyItems.push(...prodigiItems);
      }
    }

    // ==========================
    // 🌍 PRINTIFY
    // ==========================
    if (printifyItems.length) {
      try {

        const safeItems = printifyItems.filter(item =>
          item.printify?.productId && item.printify?.variantId
        );

        if (safeItems.length) {
          const result = await sendToPrintify({
            ...orderData,
            cart: safeItems
          });

          results.push({ provider: "PRINTIFY", result });
        }

      } catch (err) {
        console.error("❌ Printify failed:", err);
      }
    }

    // ==========================
    // 🧠 UPDATE ORDER
    // ==========================
    const providerUsed =
      results.length > 1
        ? "SPLIT"
        : results[0]?.provider || "FAILED";

    await supabase
      .from("orders")
      .update({
        status: "paid",
        provider: providerUsed,
        fulfillment_response: results
      })
      .eq("order_id", orderId);

    // ==========================
    // ✉️ EMAIL
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
        `
      });
    } catch (e) {
      console.error("Email failed:", e);
    }

    return res.status(200).send("Order processed");

  } catch (err) {
    console.error("🔥 ERROR:", err);
    return res.status(500).send("Server error");
  }
  }
