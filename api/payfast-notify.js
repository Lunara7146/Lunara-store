import crypto from "crypto";

function encodeValue(value = "") {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

function buildSignatureString(data, passphrase = "") {
  const filteredKeys = Object.keys(data)
    .filter((key) => key !== "signature" && data[key] !== undefined && data[key] !== null && data[key] !== "")
    .sort();

  let output = filteredKeys
    .map((key) => `${key}=${encodeValue(data[key])}`)
    .join("&");

  if (passphrase) {
    output += `&passphrase=${encodeValue(passphrase)}`;
  }

  return output;
}

function generateSignature(data, passphrase = "") {
  const signatureString = buildSignatureString(data, passphrase);
  return crypto.createHash("md5").update(signatureString).digest("hex");
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const body = req.body || {};
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    // 🔐 VERIFY SIGNATURE
    const receivedSignature = String(body.signature || "").toLowerCase();
    const expectedSignature = generateSignature(body, passphrase).toLowerCase();

    if (!receivedSignature || receivedSignature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    // ✅ ONLY PROCESS SUCCESSFUL PAYMENTS
    if (body.payment_status !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    // 🛒 PARSE FULL CART
    let cartItems = [];
    try {
      cartItems = JSON.parse(body.custom_str1 || "[]");
    } catch {
      return res.status(400).send("Invalid cart data");
    }

    if (!cartItems.length) {
      return res.status(400).send("Empty cart");
    }

    // 🔥 CONVERT TO PRINTIFY FORMAT
    const lineItems = cartItems.map(item => ({
      product_id: item.productId,
      variant_id: Number(item.variantId),
      quantity: Number(item.quantity || 1)
    }));

    // 🚚 SHIPPING DETAILS
    const orderPayload = {
      external_id: body.m_payment_id || `LUNARA-${Date.now()}`,

      line_items: lineItems,

      address_to: {
        first_name: body.name_first || "Customer",
        last_name: body.name_last || "Lunara",
        email: body.email_address || "",
        phone: body.custom_str8 || "",
        country: body.custom_str7 || "ZA",
        region: body.custom_str5 || "",
        address1: body.custom_str3 || "",
        city: body.custom_str4 || "",
        zip: body.custom_str6 || ""
      },

      shipping_method: 1,
      send_shipping_notification: true
    };

    // 🚀 SEND DIRECTLY TO PRINTIFY
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
      const errorText = await response.text();
      return res.status(500).send(`Printify error: ${errorText}`);
    }

    return res.status(200).send("Order created");

  } catch (error) {
    return res.status(500).send(`Server error: ${error.message}`);
  }
}
