import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
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

    if (!cart || !cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // ==========================
    // 🧠 SAVE ORDER TO SUPABASE
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
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Database error" });
    }

    // ==========================
    // 💳 PAYFAST REDIRECT
    // ==========================
    const paymentUrl = `https://www.payfast.co.za/eng/process?amount=${amount}&item_name=${orderId}`;

    return res.status(200).json({ url: paymentUrl });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
}
