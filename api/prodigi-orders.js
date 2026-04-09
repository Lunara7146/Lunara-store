export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, items, customer } = req.body;

    // ⚠️ TEMP PLACEHOLDER (no real SKUs yet)
    console.log("Prodigi order received:", {
      orderId,
      items,
      customer
    });

    // 🔥 This will be replaced later with real Prodigi API call
    return res.status(200).json({
      success: true,
      message: "Prodigi order simulated (no real product yet)"
    });

  } catch (err) {
    console.error("Prodigi error:", err);
    res.status(500).json({ error: "Prodigi order failed" });
  }
}
