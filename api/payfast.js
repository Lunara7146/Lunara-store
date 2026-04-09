import crypto from "crypto";

function encode(val = "") {
  return encodeURIComponent(String(val)).replace(/%20/g, "+");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const data = req.body;

  const orderId = "LUNARA-" + Date.now();

  const pfData = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,

    return_url: "https://lunara-store-tau.vercel.app/success.html",
    cancel_url: "https://lunara-store-tau.vercel.app/cancel.html",
    notify_url: "https://lunara-store-tau.vercel.app/api/payfast-notify",

    name_first: data.firstName,
    name_last: data.lastName,
    email_address: data.email,

    m_payment_id: orderId,
    amount: data.amount,
    item_name: "Lunara Order",

    custom_str1: JSON.stringify(data.cart),
    custom_str8: data.phone,
    custom_str3: data.address1,
    custom_str4: data.city,
    custom_str5: data.region,
    custom_str6: data.zip,
    custom_str7: data.country
  };

  const paramString = Object.keys(pfData)
    .sort()
    .map(k => `${k}=${encode(pfData[k])}`)
    .join("&");

  const signature = crypto
    .createHash("md5")
    .update(paramString + `&passphrase=${encode(process.env.PAYFAST_PASSPHRASE || "")}`)
    .digest("hex");

  const url = `https://sandbox.payfast.co.za/eng/process?${paramString}&signature=${signature}`;

  res.status(200).json({ url });
}
