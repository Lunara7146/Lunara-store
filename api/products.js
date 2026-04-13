// /api/products.js

const fallbackProducts = [
  {
    id: "butterfly-tee",
    name: "Butterfly Tee",
    type: "tshirt",
    basePrice: 249,
    slug: "butterfly-tee"
  },
  {
    id: "cosmic-eye-tee",
    name: "Cosmic Eye Tee",
    type: "tshirt",
    basePrice: 249,
    slug: "cosmic-eye-tee"
  },
  {
    id: "drip-smile-tee",
    name: "Drip Smile Tee",
    type: "tshirt",
    basePrice: 249,
    slug: "drip-smile-tee"
  },
  {
    id: "lotus-tee",
    name: "Lotus Tee",
    type: "tshirt",
    basePrice: 249,
    slug: "lotus-tee"
  }
  // 👉 Add ALL your products here
];

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

    let printifyProducts = [];

    // ==========================
    // 🔄 TRY FETCH PRINTIFY
    // ==========================
    if (shopId && apiToken) {
      try {
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

        if (response.ok) {
          printifyProducts = raw.data || [];
        } else {
          console.log("Printify error, using fallback");
        }
      } catch (err) {
        console.log("Printify failed, using fallback");
      }
    }

    // ==========================
    // ✅ FORMAT PRINTIFY PRODUCTS
    // ==========================
    const formattedPrintify = printifyProducts.map(product => {
      const name = (product.title || "").toLowerCase();

      let type = "other";
      if (name.includes("hoodie")) type = "hoodie";
      else if (name.includes("t-shirt") || name.includes("tee")) type = "tshirt";

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
        name: product.title,
        image: product.images?.[0]?.src || "/images/placeholder.png",
        type,

        variants,

        printify: {
          productId: product.id
        },

        prodigi: type === "tshirt"
          ? {
              sku: "GLOBAL-TEE-GIL-64000",
              printArea: "front"
            }
          : null
      };
    });

    // ==========================
    // 🖼️ FALLBACK PRODUCTS (YOUR IMAGES)
    // ==========================
    const formattedFallback = fallbackProducts.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      slug: p.slug,

      variants: [
        { size: "s", color: "black", price: p.basePrice },
        { size: "m", color: "black", price: p.basePrice },
        { size: "l", color: "black", price: p.basePrice },
        { size: "xl", color: "black", price: p.basePrice },

        { size: "s", color: "white", price: p.basePrice },
        { size: "m", color: "white", price: p.basePrice },
        { size: "l", color: "white", price: p.basePrice },
        { size: "xl", color: "white", price: p.basePrice }
      ],

      // 🔥 THIS MATCHES YOUR FOLDER STRUCTURE
      getImage: (color) =>
        `/images/${p.type === "tshirt" ? "shirts" : p.type + "s"}/${p.slug}/${color}.png`,

      printify: null,

      prodigi: p.type === "tshirt"
        ? {
            sku: "GLOBAL-TEE-GIL-64000",
            printArea: "front"
          }
        : null
    }));

    // ==========================
    // 🔥 FINAL OUTPUT
    // ==========================
    const finalProducts =
      formattedPrintify.length > 0
        ? formattedPrintify
        : formattedFallback;

    return res.status(200).json({
      success: true,
      count: finalProducts.length,
      data: finalProducts
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      data: [],
      error: "Server error",
      details: error.message
    });
  }
}
