import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const data = req.body;

  const pfData = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,

    return_url: "https://lunara-store-tau.vercel.app/success.html",
    cancel_url: "https://lunara-store-tau.vercel.app/cancel.html",
    notify_url: "https://lunara-store-tau.vercel.app/api/payfast-notify",

    name_first: data.firstName,
    name_last: data.lastName,
    email_address: data.email,

    const orderId = "LUNARA-" + Date.now();

m_payment_id: orderId,
custom_str9: orderId, // 👈 we use this for tracking redirect

    // 🛒 FULL CART
    custom_str1: JSON.stringify(data.cart),

    // 🚚 SHIPPING
    custom_str3: data.address1,
    custom_str4: data.city,
    custom_str5: data.region,
    custom_str6: data.zip,
    custom_str7: data.country,
    custom_str8: data.phone
  };

  // ✅ Remove empty values
  const filtered = Object.entries(pfData)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "");

  // ✅ Sort keys (VERY IMPORTANT)
  const sorted = filtered.sort(([a], [b]) => a.localeCompare(b));

  let paramString = sorted
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");

  // ✅ Add passphrase if exists
  if (process.env.PAYFAST_PASSPHRASE) {
    paramString += `&passphrase=${encodeURIComponent(process.env.PAYFAST_PASSPHRASE)}`;
  }

  const signature = crypto
    .createHash("md5")
    .update(paramString)
    .digest("hex");

  const paymentUrl = `https://sandbox.payfast.co.za/eng/process?${paramString}&signature=${signature}`;

  // ✅ RETURN URL (NOT RAW DATA)
  res.status(200).json({
    url: paymentUrl
  });
                }
