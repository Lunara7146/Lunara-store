// /api/payfast.js

import crypto from "crypto";
import { supabase } from "../lib/supabase";

function generateSignature(data, passphrase = "") {
  const sorted = Object.keys(data)
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");

  const string = passphrase
    ? `${sorted}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    : sorted;

  return crypto.createHash("md5").update(string).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      amount,
      cart,
      supplier,
      address1,
      city,
      region,
      zip,
      country,
      phone,
      orderId
    } = req.body;

    // ==========================
    // 🚨 VALIDATION
    // ==========================
    if (!cart || !cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "Missing customer info" });
    }

    // ==========================
    // 🧠 SAVE ORDER (PENDING)
    // ==========================
    const { error } = await supabase.from("orders").insert([
      {
        order_id: orderId,
        email,
        amount,
        status: "pending",
        supplier,
        cart,
        customer: {
          firstName,
          lastName,
          address1,
          city,
          region,
          zip,
          country,
          phone
        }
      }
    ]);

    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    // ==========================
    // 💳 PAYFAST CONFIG
    // ==========================
    const merchant_id = process.env.PAYFAST_MERCHANT_ID;
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const baseUrl = process.env.BASE_URL;

    if (!merchant_id || !merchant_key) {
      return res.status(500).json({ error: "Missing PayFast config" });
    }

    // ==========================
    // 💳 PAYMENT DATA
    // ==========================
    const paymentData = {
      merchant_id,
      merchant_key,
      return_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/cancel.html`,
      notify_url: `${baseUrl}/api/payfast-notify`,

      name_first: firstName,
      name_last: lastName,
      email_address: email,

      m_payment_id: orderId,
      amount: Number(amount).toFixed(2),
      item_name: `Order ${orderId}`
    };

    // ==========================
    // 🔐 SIGNATURE
    // ==========================
    const signature = generateSignature(paymentData, passphrase);

    // ==========================
    // 🔗 BUILD URL
    // ==========================
    const query = new URLSearchParams({
      ...paymentData,
      signature
    }).toString();

    const paymentUrl = `https://www.payfast.co.za/eng/process?${query}`;

    return res.status(200).json({
      success: true,
      url: paymentUrl
    });

  } catch (err) {
    console.error("🔥 Checkout error:", err);

    return res.status(500).json({
      error: "Checkout failed",
      details: err.message
    });
  }
      }
