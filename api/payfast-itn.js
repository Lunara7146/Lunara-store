import crypto from "crypto";
import { supabase } from "../lib/supabase";

// 🔁 RETRY HELPER
async function retry(fn, retries = 3) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    return retry(fn, retries - 1);
  }
}

export default async function handler(req, res) {
  try {
    const data = req.body;

    // ==========================
    // 🔐 SIGNATURE CHECK
    // ==========================
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    const pfData = { ...data };
    const receivedSignature = pfData.signature;
    delete pfData.signature;

    const sortedKeys = Object.keys(pfData).sort();

    const queryString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(pfData[key]).replace(/%20/g, "+")}`)
      .join("&");

    const signatureString = passphrase
      ? `${queryString}&passphrase=${encodeURIComponent(passphrase)}`
      : queryString;

    const generatedSignature = crypto
      .createHash("md5")
      .update(signatureString)
      .digest("hex");

    if (generatedSignature !== receivedSignature) {
      return res.status(400).send("Invalid signature");
    }

    // ==========================
    // 💳 PAYMENT CHECK
    // ==========================
    if (data.payment_status !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    const orderId = data.item_name;

    // ==========================
    // 🧠 FETCH ORDER
    // ==========================
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order || error) {
      return res.status(400).send("Order not found");
    }

    // 🚫 BLOCK DUPLICATES
    if (order.fulfilled) {
      return res.status(200).send("Already fulfilled");
    }

    const { supplier, cart, customer } = order;

    // ==========================
    // 💰 VERIFY AMOUNT
    // ==========================
    const paidAmount = parseFloat(data.amount_gross);

    const expectedAmount = cart.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    if (Math.abs(expectedAmount - paidAmount) > 1) {
      return res.status(400).send("Amount mismatch");
    }

    // ==========================
    // 🚚 SEND ORDER (WITH RETRY)
    // ==========================
    if (supplier === "prodigi") {

      await retry(() =>
        fetch(`${req.headers.origin}/api/prodigi-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            items: cart,
            customer
          })
        })
      );

    } else {

      await retry(() =>
        fetch(`${req.headers.origin}/api/printify-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            items: cart,
            shipping: {
              first_name: customer.firstName,
              last_name: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              address1: customer.address1,
              city: customer.city,
              region: customer.region,
              zip: customer.zip,
              country: customer.country
            }
          })
        })
      );
    }

    // ==========================
    // ✅ MARK AS FULFILLED
    // ==========================
    await supabase
      .from("orders")
      .update({
        fulfilled: true
      })
      .eq("id", orderId);

    return res.status(200).send("OK");

  } catch (err) {
    console.error("ITN ERROR:", err);
    return res.status(500).send("Error");
  }
}
