// /api/products.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      data: [],
      error: "Method not allowed"
    });
  }

  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const apiToken = process.env.PRINTIFY_API_TOKEN;

    if (!shopId || !apiToken) {
      return res.status(500).json({
        success: false,
        data: [],
        error: "Missing Printify environment variables"
      });
    }

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`
        }
      }
    );

    const raw = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        data: [],
        error: "Failed to fetch products",
        details: raw
      });
    }

    const products = raw.data || [];

    const enhancedProducts = products.map(product => {
      const name = (product.title || "").toLowerCase();

      let type = "other";
      if (name.includes("hoodie")) type = "hoodie";
      else if (name.includes("t-shirt") || name.includes("tee")) type = "tshirt";

      // ✅ BUILD VARIANT MAP
      const variants = (product.variants || [])
        .filter(v => v.is_enabled)
        .map(v => {
          const sizeOption = product.options?.find(o => o.name.toLowerCase() === "size");
          const colorOption = product.options?.find(o => o.name.toLowerCase() === "color");

          const size = sizeOption ? sizeOption.values[v.options[0]] : "unknown";
          const color = colorOption ? colorOption.values[v.options[1]] : "unknown";

          return {
            id: v.id,
            price: v.price / 100,
            size: size?.toLowerCase(),
            color: color?.toLowerCase()
          };
        });

      return {
        id: product.id,
        title: product.title,
        name: product.title,
        category: "all",
        image: product.images?.[0]?.src || "/images/placeholder.png",
        type,

        // 🔥 THIS IS THE IMPORTANT PART
        variants,

        // used later for routing
        printify: {
          productId: product.id
        },

        // 🇿🇦 PRODIGI (SAME FOR ALL T-SHIRTS)
        prodigi: type === "tshirt"
          ? {
              sku: "GLOBAL-TEE-GIL-64000",
              printArea: "front"
            }
          : null
      };
    });

    return res.status(200).json({
      success: true,
      count: enhancedProducts.length,
      data: enhancedProducts
    });

  } catch (error) {
    console.error("PRINTIFY FETCH ERROR:", error);

    return res.status(500).json({
      success: false,
      data: [],
      error: "Server error",
      details: error.message
    });
  }
}
