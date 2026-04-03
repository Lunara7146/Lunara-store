function clean(value = "") {
  return String(value).trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.PRINTIFY_API_TOKEN;
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const userAgent = process.env.PRINTIFY_USER_AGENT || "LunaraStore/1.0";

    if (!token || !shopId) {
      return res.status(500).json({
        error: "Missing Printify environment variables",
        required: ["PRINTIFY_API_TOKEN", "PRINTIFY_SHOP_ID"]
      });
    }

    const {
      external_id,
      line_items,
      address_to,
      shipping_method = 1,
      send_shipping_notification = false
    } = req.body || {};

    if (!external_id || !Array.isArray(line_items) || !line_items.length || !address_to) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["external_id", "line_items", "address_to"]
      });
    }

    const payload = {
      external_id: clean(external_id),
      line_items: line_items.map((item) => ({
        product_id: clean(item.product_id),
        variant_id: Number(item.variant_id),
        quantity: Number(item.quantity || 1)
      })),
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
      send_shipping_notification: Boolean(send_shipping_notification)
    };

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/orders.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": userAgent,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to create Printify order",
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
