import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing order id"
      });
    }

    // ==========================
    // 🧠 GET ORDER FROM SUPABASE
    // ==========================
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    const fulfillment = order.fulfillment_response || [];

    // ==========================
    // 📦 BUILD SHIPMENTS
    // ==========================
    const shipments = fulfillment.map(f => {
      let tracking = null;
      let status = "processing";

      // 🔥 PRINTIFY
      if (f.provider === "PRINTIFY") {
        tracking =
          f.result?.shipments?.[0]?.tracking_url ||
          f.result?.shipments?.[0]?.tracking_number ||
          null;

        status =
          f.result?.status === "fulfilled"
            ? "shipped"
            : f.result?.status || "processing";
      }

      // 🔥 PRODIGI
      if (f.provider === "PRODIGI") {
        tracking =
          f.result?.orders?.[0]?.tracking?.url ||
          f.result?.orders?.[0]?.tracking?.number ||
          null;

        status =
          f.result?.status === "Complete"
            ? "shipped"
            : f.result?.status || "processing";
      }

      return {
        provider: f.provider,
        status,
        tracking
      };
    });

    // ==========================
    // 🎯 FINAL RESPONSE
    // ==========================
    return res.status(200).json({
      success: true,
      orderId: order.order_id,
      status: order.status,
      provider: order.provider,
      amount: order.amount,
      shipments
    });

  } catch (err) {
    console.error("TRACK ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Server error",
      details: err.message
    });
  }
}
