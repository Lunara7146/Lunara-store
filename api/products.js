// /api/products.js

const customProductMap = {
  // 🔥 MAP YOUR PRODUCTS HERE

  // Example (REPLACE THESE WITH YOUR REAL IDs)
  "PRINTIFY_PRODUCT_ID_1": {
    prodigiSku: "GILDAN-18500-BLACK-M",
    designUrl: "https://yourdomain.com/images/designs/hoodie.png",
    printArea: "front"
  },

  "PRINTIFY_PRODUCT_ID_2": {
    prodigiSku: "GILDAN-64000-WHITE-M",
    designUrl: "https://yourdomain.com/images/designs/shirt.png",
    printArea: "front"
  }
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const apiToken = process.env.PRINTIFY_API_TOKEN;

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch products",
        details: data
      });
    }

    // 🔥 MERGE PRINTIFY + PRODIGI DATA
    const enhancedProducts = data.data.map(product => {
      const mapping = customProductMap[product.id] || {};

      return {
        ...product,

        // Attach Prodigi data
        prodigiSku: mapping.prodigiSku || null,
        designUrl: mapping.designUrl || null,
        printArea: mapping.printArea || "front"
      };
    });

    return res.status(200).json({
      ...data,
      data: enhancedProducts
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
