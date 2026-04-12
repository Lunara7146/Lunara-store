// /api/prodigy-orders.js

import { sendToProdigi } from "../lib/prodigi.js";

function clean(value = "") {
  return String(value).trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { external_id, items, shipping_address } = req.body || {};

    if (!external_id || !items || !items.length || !shipping_address) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // ✅ BUILD PRODIGI ITEMS (LOCK SKU HERE)
    const prodigiItems = items.map(item => {
      if (!item.designUrl) {
        throw new Error(`Missing designUrl for ${item.name}`);
      }

      return {
        sku: "GLOBAL-TEE-GIL-64000", // 🔥 LOCKED SKU
        copies: Number(item.quantity || 1),

        attributes: {
          size: clean(item.size).toUpperCase()
        },

        assets: [
          {
            printArea: "front",
            url: clean(item.designUrl)
          }
        ]
      };
    });

    // ✅ FULL PRODIGI ORDER
    const prodigiOrder = {
      externalReference: clean(external_id),

      shippingAddress: {
        firstName: clean(shipping_address.first_name),
        lastName: clean(shipping_address.last_name),
        email: clean(shipping_address.email),
        phoneNumber: clean(shipping_address.phone),
        addressLine1: clean(shipping_address.address1),
        city: clean(shipping_address.city),
        postalOrZipCode: clean(shipping_address.zip),
        countryCode: clean(shipping_address.country)
      },

      items: prodigiItems
    };

    console.log("📦 PRODIGI ORDER:", JSON.stringify(prodigiOrder, null, 2));

    const result = await sendToProdigi(prodigiOrder);

    return res.status(200).json({
      success: true,
      provider: "PRODIGI",
      result
    });

  } catch (error) {
    console.error("❌ PRODIGI ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Prodigi order failed",
      details: error.message
    });
  }
}
