// /api/products.js

const BASE_URL = process.env.BASE_URL || "https://lunara-store-tau.vercel.app";

const customProductMap = {
  "69e1372a9a925d330745ac": {
    slug: "butterfly-tee",
    type: "tshirt"
  },
  "69dd5de6b6ed0be65d019626": {
    slug: "lotus-tee",
    type: "tshirt"
  },
  "69e1138b4e1866579d0eccbe": {
    slug: "drip-smile-tee",
    type: "tshirt"
  },
  "69dd4952d1e0d36df60a4396": {
    slug: "infinity-tee",
    type: "tshirt"
  },
  "69e38b68471a0f6f504a4b4a": {
    slug: "cosmic-eye-tee",
    type: "tshirt"
  },
  "69dd5766f7c91c5ba40e0f4a": {
    slug: "psychedelic-mushroom-tee",
    type: "tshirt"
  }
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

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
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
        error: "Failed to fetch Printify products",
        details: raw
      });
    }

    const products = raw.data || [];

    const mapped = products
      .filter((product) => customProductMap[product.id])
      .map((product) => {
        const config = customProductMap[product.id];
        const enabledVariants = (product.variants || []).filter((v) => v.is_enabled);
        const firstVariant = enabledVariants[0] || product.variants?.[0] || null;

        return {
          id: product.id,
          slug: config.slug,
          type: config.type,
          name: product.title,
          category: config.type,
          price: firstVariant ? firstVariant.price / 100 : 0,

          image: `${BASE_URL}/images/shirts/${config.slug}/black.png`,
          images: {
            black: `${BASE_URL}/images/shirts/${config.slug}/black.png`,
            white: `${BASE_URL}/images/shirts/${config.slug}/white.png`
          },

          variants: enabledVariants.map((variant) => ({
            id: variant.id,
            title: variant.title,
            price: variant.price / 100,
            is_enabled: variant.is_enabled
          })),

          printify: firstVariant
            ? {
                productId: product.id,
                variantId: firstVariant.id
              }
            : null,

          prodigi: {
            designUrlMap: {
              black: `${BASE_URL}/images/shirts/${config.slug}/black.png`,
              white: `${BASE_URL}/images/shirts/${config.slug}/white.png`
            },
            prodigiSkuMap: {
              white: {
                S: "GILDAN-64000-WHITE-S",
                M: "GILDAN-64000-WHITE-M",
                L: "GILDAN-64000-WHITE-L",
                XL: "GILDAN-64000-WHITE-XL",
                XXL: "GILDAN-64000-WHITE-2XL",
                XXXL: "GILDAN-64000-WHITE-3XL"
              },
              black: {
                S: "GILDAN-64000-BLACK-S",
                M: "GILDAN-64000-BLACK-M",
                L: "GILDAN-64000-BLACK-L",
                XL: "GILDAN-64000-BLACK-XL",
                XXL: "GILDAN-64000-BLACK-2XL",
                XXXL: "GILDAN-64000-BLACK-3XL"
              }
            },
            printArea: "front"
          }
        };
      });

    return res.status(200).json({
      success: true,
      data: mapped
    });
  } catch (err) {
    console.error("PRODUCTS ERROR:", err);

    return res.status(500).json({
      success: false,
      data: [],
      error: "Server error",
      details: err.message
    });
  }
}
