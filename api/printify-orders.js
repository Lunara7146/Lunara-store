// /api/printify-orders.js

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
    const token = process.env.PRINTIFY_API_TOKEN;
    const shopId = process.env.PRINTIFY_SHOP_ID;

    if (!token || !shopId) {
      return res.status(500).json({
        success: false,
        error: "Missing Printify environment variables"
      });
    }

    const {
      external_id,
      line_items,
      address_to,
      shipping_method = 1,
      send_shipping_notification = false,
      metadata = {} // ✅ added
    } = req.body || {};

    if (!external_id || !Array.isArray(line_items) || !line_items.length || !address_to) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // ✅ STRICT VALIDATION
    const safeLineItems = line_items.map(item => {
      if (!item.product_id || !item.variant_id) {
        console.error("❌ BAD LINE ITEM:", item);
        throw new Error("Invalid line item");
      }

      return {
        product_id: clean(item.product_id),
        variant_id: Number(item.variant_id),
        quantity: Number(item.quantity || 1)
      };
    });

    const payload = {
      external_id: clean(external_id),
      line_items: safeLineItems,

      address_to: {
        first_name: clean(address_to.first_name),
        last_name: clean(address_to.last_name),
        email: clean(address_to.email),
        phone: clean(address_to.phone),
        country: clean(address_to.country),
        region: clean(address_to.region),
        address1: clean(address_to.address1),
        city: clean(address_to.city),
        zip: clean(address_to.zip)
      },

      shipping_method: Number(shipping_method),
      send_shipping_notification: Boolean(send_shipping_notification),

      metadata // ✅ useful for debugging orders later
    };

    console.log("📦 PRINTIFY ORDER:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/orders.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ PRINTIFY ERROR:", data);

      return res.status(response.status).json({
        success: false,
        error: "Failed to create order",
        details: data
      });
    }

    console.log("✅ PRINTIFY SUCCESS:", data.id);

    return res.status(200).json({
      success: true,
      order: data
    });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message
    });
  }
}
