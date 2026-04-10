// /api/prodigi-orders.js

import { sendToProdigi } from "../lib/prodigi.js";

export default async function handler(req, res) {
  try {
    const order = req.body;

    // ✅ VALIDATION
    for (const item of order.items) {
      if (!item.designUrl) {
        return res.status(400).json({
          error: `Missing designUrl for ${item.name}`
        });
      }
    }

    const result = await sendToProdigi(order);

    return res.status(200).json({
      success: true,
      provider: "PRODIGI",
      result
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Prodigi order failed"
    });
  }
}
