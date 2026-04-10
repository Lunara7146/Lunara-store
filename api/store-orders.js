import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
  try {
    const { orderId, supplier, cart, customer } = req.body;

    const { error } = await supabase.from("orders").insert([
      {
        id: orderId,
        supplier,
        cart,
        customer
      }
    ]);

    if (error) throw error;

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("Store order error:", err);
    res.status(500).json({ error: "Failed to store order" });
  }
}
