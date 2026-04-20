// /api/products.js

const BASE_URL =
  process.env.BASE_URL?.replace(/\/$/, "") ||
  "https://lunara-store-tau.vercel.app";

// ==========================
// 🧠 PRODUCT MAP
// Only mapped Printify products will show from API
// ==========================
const customProductMap = {
  "69e1372a9a925d330745ac": {
    slug: "butterfly-tee",
    type: "tshirt",
    folder: "shirts"
  },
  "69dd5de6b6ed0be65d019626": {
    slug: "lotus-tee",
    type: "tshirt",
    folder: "shirts"
  },
  "69e1138b4e1866579d0eccbe": {
    slug: "drip-smile-tee",
    type: "tshirt",
    folder: "shirts"
  },
  "69dd4952d1e0d36df60a4396": {
    slug: "infinity-tee",
    type: "tshirt",
    folder: "shirts"
  },
  "69e38b68471a0f6f504a4b4a": {
    slug: "cosmic-eye-tee",
    type: "tshirt",
    folder: "shirts"
  },
  "69dd5766f7c91c5ba40e0f4a": {
    slug: "psychedelic-mushroom-tee",
    type: "tshirt",
    folder: "shirts"
  }
};

// ==========================
// 🛟 LOCAL FALLBACK SHIRTS
// These still load if Printify API fails
// ==========================
const localFallbackProducts = [
  {
    id: "69e1372a9a925d330745ac",
    slug: "butterfly-tee",
    type: "tshirt",
    name: "Butterfly Tee",
    category: "tshirt",
    price: 349
  },
  {
    id: "69dd5de6b6ed0be65d019626",
    slug: "lotus-tee",
    type: "tshirt",
    name: "Lotus Tee",
    category: "tshirt",
    price: 349
  },
  {
    id: "69e1138b4e1866579d0eccbe",
    slug: "drip-smile-tee",
    type: "tshirt",
    name: "Drip Smile Tee",
    category: "tshirt",
    price: 349
  },
  {
    id: "69dd4952d1e0d36df60a4396",
    slug: "infinity-tee",
    type: "tshirt",
    name: "Infinity Tee",
    category: "tshirt",
    price: 349
  },
  {
    id: "69e38b68471a0f6f504a4b4a",
    slug: "cosmic-eye-tee",
    type: "tshirt",
    name: "Cosmic Eye Tee",
    category: "tshirt",
    price: 349
  },
  {
    id: "69dd5766f7c91c5ba40e0f4a",
    slug: "psychedelic-mushroom-tee",
    type: "tshirt",
    name: "Psychedelic Mushroom Tee",
    category: "tshirt",
    price: 349
  }
];

// ==========================
// ⚙️ HELPERS
// ==========================
function buildImageSet(folder, slug) {
  return {
    black: `${BASE_URL}/images/${folder}/${slug}/black.png`,
    white: `${BASE_URL}/images/${folder}/${slug}/white.png`
  };
}

function getEnabledVariants(product) {
  return Array.isArray(product?.variants)
    ? product.variants.filter((v) => v.is_enabled)
    : [];
}

function mapPrintifyVariantTitle(title = "") {
  const normalized = String(title).toUpperCase();

  let color = normalized.includes("WHITE")
    ? "white"
    : normalized.includes("BLACK")
    ? "black"
    : null;

  let size = null;

  if (normalized.includes("XXXL") || normalized.includes("3XL")) size = "XXXL";
  else if (normalized.includes("XXL") || normalized.includes("2XL")) size = "XXL";
  else if (normalized.includes("XL")) size = "XL";
  else if (normalized.includes("L")) size = "L";
  else if (normalized.includes("M")) size = "M";
  else if (normalized.includes("S")) size = "S";

  return { color, size };
}

function buildPrintifyVariantMap(variants = []) {
  const map = {
    black: {},
    white: {}
  };

  variants.forEach((variant) => {
    const parsed = mapPrintifyVariantTitle(variant.title);

    if (parsed.color && parsed.size) {
      map[parsed.color][parsed.size] = variant.id;
    }
  });

  return map;
}

function buildProdigiSkuMap() {
  return {
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
  };
}

function mapProductFromPrintify(product) {
  const config = customProductMap[product.id];
  if (!config) return null;

  const enabledVariants = getEnabledVariants(product);
  const usableVariants = enabledVariants.length
    ? enabledVariants
    : Array.isArray(product.variants)
    ? product.variants
    : [];

  const firstVariant = usableVariants[0] || null;
  const images = buildImageSet(config.folder, config.slug);

  return {
    id: product.id,
    slug: config.slug,
    type: config.type,
    name: product.title || config.slug,
    category: config.type,
    price: firstVariant ? Number(firstVariant.price || 0) / 100 : 0,

    image: images.black,
    images,

    variants: usableVariants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      price: Number(variant.price || 0) / 100,
      is_enabled: Boolean(variant.is_enabled),
      is_available: variant.is_available ?? true
    })),

    printify: firstVariant
      ? {
          productId: product.id,
          variantId: firstVariant.id,
          variantMap: buildPrintifyVariantMap(usableVariants)
        }
      : null,

    prodigi: {
      designUrlMap: {
        black: images.black,
        white: images.white
      },
      prodigiSkuMap: buildProdigiSkuMap(),
      printArea: "front"
    }
  };
}

function mapFallbackProduct(product) {
  const images = buildImageSet("shirts", product.slug);

  return {
    id: product.id,
    slug: product.slug,
    type: product.type,
    name: product.name,
    category: product.category,
    price: product.price,

    image: images.black,
    images,

    variants: [],

    // Keep these truthy so the storefront can still add to cart visually.
    // Real fulfillment mapping gets used once Printify returns live variants.
    printify: {
      productId: product.id,
      variantId: null,
      variantMap: {
        black: {},
        white: {}
      }
    },

    prodigi: {
      designUrlMap: {
        black: images.black,
        white: images.white
      },
      prodigiSkuMap: buildProdigiSkuMap(),
      printArea: "front"
    }
  };
}

// ==========================
// 🚀 HANDLER
// ==========================
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
      return res.status(200).json({
        success: true,
        data: localFallbackProducts.map(mapFallbackProduct),
        source: "local-fallback",
        warning: "Missing Printify environment variables"
      });
    }

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          ...(process.env.PRINTIFY_USER_AGENT
            ? { "User-Agent": process.env.PRINTIFY_USER_AGENT }
            : {})
        }
      }
    );

    const raw = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        success: true,
        data: localFallbackProducts.map(mapFallbackProduct),
        source: "local-fallback",
        warning: "Failed to fetch Printify products",
        details: raw
      });
    }

    const products = Array.isArray(raw.data) ? raw.data : [];

    const mapped = products
      .filter((product) => customProductMap[product.id])
      .map(mapProductFromPrintify)
      .filter(Boolean);

    if (!mapped.length) {
      return res.status(200).json({
        success: true,
        data: localFallbackProducts.map(mapFallbackProduct),
        source: "local-fallback",
        warning: "No mapped Printify products found"
      });
    }

    return res.status(200).json({
      success: true,
      data: mapped,
      source: "printify"
    });
  } catch (err) {
    console.error("PRODUCTS ERROR:", err);

    return res.status(200).json({
      success: true,
      data: localFallbackProducts.map(mapFallbackProduct),
      source: "local-fallback",
      warning: "Server error, fallback used",
      details: err.message
    });
  }
      }
