// /api/products.js

// ==========================
// 🧠 CUSTOM PRODUCT MAPPING
// ==========================
const customProductMap = {
  // 🔥 ADD YOUR REAL PRODUCTS HERE

  /*
  "PRINTIFY_PRODUCT_ID": {
    type: "hoodie", // hoodie | tshirt | pants | other
    prodigiSku: "GILDAN-18500-BLACK-M",
    designUrl: "https://yourdomain.com/designs/hoodie.png",
    printArea: "front"
  }
  */
};

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

    // ==========================
    // 📦 FETCH PRINTIFY PRODUCTS
    // ==========================
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

    // ==========================
    // 🔄 TRANSFORM PRODUCTS
    // ==========================
    const enhancedProducts = products.map(product => {

      const mapping = customProductMap[product.id] || {};

      // ✅ Only enabled variants
      const validVariants = (product.variants || []).filter(v => v.is_enabled);
      const variant = validVariants[0] || product.variants?.[0];

      // ==========================
      // 🧠 DETECT TYPE (FALLBACK)
      // ==========================
      const name = (product.title || "").toLowerCase();

      let detectedType = "other";

      if (name.includes("hoodie")) detectedType = "hoodie";
      else if (name.includes("t-shirt") || name.includes("tee")) detectedType = "tshirt";
      else if (name.includes("pants")) detectedType = "pants";

      const finalType = mapping.type || detectedType;

      return {
        id: product.id,

        // ==========================
        // 🧾 BASIC INFO
        // ==========================
        title: product.title || "Untitled Product",
        name: product.title || "Untitled Product",
        category: "all",

        // ==========================
        // 💰 PRICE
        // ==========================
        price: variant?.price ? variant.price / 100 : 0,

        // ==========================
        // 🖼 IMAGE
        // ==========================
        image: product.images?.[0]?.src || "/images/placeholder.png",

        // ==========================
        // 🧠 PRODUCT TYPE (CRITICAL)
        // ==========================
        type: finalType,

        // ==========================
        // 🖨 PRINTIFY DATA
        // ==========================
        printify: variant
          ? {
              productId: product.id,
              variantId: variant.id
            }
          : null,

        // ==========================
        // 🇿🇦 PRODIGI DATA
        // ==========================
        prodigi:
          mapping.prodigiSku && mapping.designUrl
            ? {
                sku: mapping.prodigiSku,
                designUrl: mapping.designUrl,
                printArea: mapping.printArea || "front"
              }
            : null,

        // ==========================
        // 🧾 RAW (OPTIONAL DEBUG)
        // ==========================
        variants: validVariants,
        images: product.images || []
      };
    });

    // ==========================
    // ✅ RESPONSE
    // ==========================
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
