import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const data = req.body;

  const pfData = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,

    return_url: "https://your-site.vercel.app/success.html",
    cancel_url: "https://your-site.vercel.app/cancel.html",
    notify_url: "https://your-site.vercel.app/api/payfast-notify",

    name_first: data.firstName,
    name_last: data.lastName,
    email_address: data.email,

    m_payment_id: Date.now().toString(),
    amount: data.amount,
    item_name: "Lunara Order",

    custom_str1: JSON.stringify(data.cart)
  };

  let paramString = Object.entries(pfData)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");

  if (process.env.PAYFAST_PASSPHRASE) {
    paramString += `&passphrase=${encodeURIComponent(process.env.PAYFAST_PASSPHRASE)}`;
  }

  const signature = crypto
    .createHash("md5")
    .update(paramString)
    .digest("hex");

  pfData.signature = signature;

  res.status(200).json(pfData);
}
