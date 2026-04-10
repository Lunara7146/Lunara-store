import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
  try {
    const { orderId } = req.body;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) throw error;

    res.status(200).json(data);

  } catch (err) {
    console.error("Get order error:", err);
    res.status(200).json(null);
  }
}
