import crypto from "crypto";
import { supabase } from "../lib/supabase";

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

    console.log("🔔 PayFast ITN:", data);

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
    // 🌐 VERIFY WITH PAYFAST
    // ==========================
    const verifyRes = await fetch("https://www.payfast.co.za/eng/query/validate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: queryString
    });

    const verifyText = await verifyRes.text();

    if (verifyText !== "VALID") {
      return res.status(400).send("Validation failed");
    }

    // ==========================
    // 💳 PAYMENT STATUS
    // ==========================
    if (data.payment_status !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    const orderId = data.item_name;
    const paidAmount = parseFloat(data.amount_gross);

    // ==========================
    // 🧠 FETCH ORDER
    // ==========================
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (!order) {
      return res.status(400).send("Order not found");
    }

    if (order.fulfilled) {
      return res.status(200).send("Already fulfilled");
    }

    const { supplier, cart, customer } = order;

    // ==========================
    // 💰 VERIFY AMOUNT
    // ==========================
    const expectedAmount = cart.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    if (Math.abs(expectedAmount - paidAmount) > 1) {
      return res.status(400).send("Amount mismatch");
    }

    // ==========================
    // 🧾 UPDATE PAYMENT STATUS
    // ==========================
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "paid",
        payfast_payment_id: data.pf_payment_id
      })
      .eq("order_id", orderId);

    // ==========================
    // 🚚 FULFILLMENT LOGIC
    // ==========================

    if (supplier === "printify") {

      // 🔥 BUILD LINE ITEMS WITH VARIANTS
      const line_items = cart.map(item => {
        const variant = item.variants?.find(v =>
          v.size === item.size.toLowerCase() &&
          v.color === item.color.toLowerCase()
        );

        if (!variant) {
          throw new Error(`Variant not found for ${item.name}`);
        }

        return {
          product_id: item.printify.productId,
          variant_id: variant.id,
          quantity: item.quantity
        };
      });

      await retry(() =>
        fetch(`${req.headers.origin}/api/printify-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            external_id: orderId,
            line_items,
            address_to: {
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

    } else if (supplier === "prodigi") {

      const items = cart.map(item => ({
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        designUrl: item.designUrl
      }));

      await retry(() =>
        fetch(`${req.headers.origin}/api/prodigy-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            external_id: orderId,
            items,
            shipping_address: {
              first_name: customer.firstName,
              last_name: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              address1: customer.address1,
              city: customer.city,
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
        fulfilled: true,
        fulfillment_status: "fulfilled"
      })
      .eq("order_id", orderId);

    console.log("🎉 Order completed:", orderId);

    return res.status(200).send("OK");

  } catch (err) {
    console.error("🔥 ITN ERROR:", err);
    return res.status(500).send("Error");
  }
}
