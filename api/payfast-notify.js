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

    const receivedSignature = String(body.signature || "").trim().toLowerCase();
    const expectedSignature = generateSignature(body, passphrase).toLowerCase();

    if (!receivedSignature || receivedSignature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    if (body.payment_status !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    const externalId = body.m_payment_id || `LUNARA-${Date.now()}`;
    const productId = body.custom_str1 || "";
    const variantId = body.custom_str2 || "";
    const quantity = Number(body.custom_int1 || 1);

    const firstName = body.name_first || "Customer";
    const lastName = body.name_last || "Lunara";
    const email = body.email_address || "";
    const phone = body.custom_str8 || "";
    const address1 = body.custom_str3 || "";
    const city = body.custom_str4 || "";
    const region = body.custom_str5 || "";
    const zip = body.custom_str6 || "";
    const country = body.custom_str7 || "ZA";

    if (!productId || !variantId) {
      return res.status(400).send("Missing product mapping");
    }

    const orderPayload = {
      external_id: externalId,
      line_items: [
        {
          product_id: productId,
          variant_id: Number(variantId),
          quantity
        }
      ],
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        country,
        region,
        address1,
        city,
        zip
      },
      shipping_method: 1,
      send_shipping_notification: false
    };

    const baseUrl =
      process.env.BASE_URL || "https://lunara-store-tau.vercel.app";

    const response = await fetch(`${baseUrl}/api/printify-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).send(`Printify order failed: ${text}`);
    }

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send(`Server error: ${error.message}`);
  }
}
