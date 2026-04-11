// /api/products.js

const customProductMap = {
  // 🔥 OPTIONAL: map Printify → Prodigi
  // Replace with real IDs later if needed

  // "PRINTIFY_PRODUCT_ID": {
  //   prodigiSku: "SKU",
  //   designUrl: "https://yourdomain.com/design.png",
  //   printArea: "front"
  // }
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
    const apiToken = process.env.PRINTIFY_API_KEY; // ✅ FIXED NAME

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

    // ✅ SAFE DATA EXTRACTION
    const products = raw.data || [];

    // 🔥 CLEAN + SAFE MAPPING
    const enhancedProducts = products.map(product => {
      const mapping = customProductMap[product.id] || {};

      const validVariants = (product.variants || []).filter(v => v.is_enabled);

      return {
        id: product.id,
        title: product.title || "Untitled Product",

        // ✅ Only enabled variants
        variants: validVariants.length ? validVariants : product.variants || [],

        // ✅ Safe images
        images: product.images || [],

        // 🔥 Attach extra data
        prodigiSku: mapping.prodigiSku || null,
        designUrl: mapping.designUrl || null,
        printArea: mapping.printArea || "front"
      };
    });

    return res.status(200).json({
      success: true,
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
