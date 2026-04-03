import crypto from "crypto";

function encode(value = "") {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

function buildSignatureString(data, passphrase = "") {
  const excluded = ["signature"];
  const keys = Object.keys(data)
    .filter(key => !excluded.includes(key) && data[key] !== "")
    .sort();

  let pfOutput = keys
    .map(key => `${key}=${encode(data[key])}`)
    .join("&");

  if (passphrase) {
    pfOutput += `&passphrase=${encode(passphrase)}`;
  }

  return pfOutput;
}

function generateSignature(data, passphrase = "") {
  const signatureString = buildSignatureString(data, passphrase);
  return crypto.createHash("md5").update(signatureString).digest("hex");
}

async function createPrintifyOrder(orderData) {
  const response = await fetch(`${process.env.BASE_URL}/api/printify-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  return { ok: response.ok, status: response.status, result };
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
      return res.status(200).send("Ignored: payment not complete");
    }

    // These custom fields must be sent from your checkout form
    const externalId = body.m_payment_id;
    const productId = body.custom_str1;
    const variantId = body.custom_str2;
    const quantity = body.custom_int1 || 1;

    const firstName = body.name_first || "Customer";
    const lastName = body.name_last || "Lunara";
    const email = body.email_address || "";

    // These also need to come from your checkout form
    const address1 = body.custom_str3 || "";
    const city = body.custom_str4 || "";
    const region = body.custom_str5 || "";
    const zip = body.custom_str6 || "";
    const country = body.custom_str7 || "ZA";
    const phone = body.custom_str8 || "";

    if (!productId || !variantId) {
      return res.status(400).send("Missing Printify product mapping");
    }

    const printifyOrder = {
      external_id: externalId,
      line_items: [
        {
          product_id: productId,
          variant_id: Number(variantId),
          quantity: Number(quantity)
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

    const created = await createPrintifyOrder(printifyOrder);

    if (!created.ok) {
      return res.status(500).send("Payment confirmed but Printify order failed");
    }

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send(`Server error: ${error.message}`);
  }
                                  }
