export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const apiToken = process.env.PRINTIFY_API_TOKEN;
    const userAgent = process.env.PRINTIFY_USER_AGENT || "LunaraStore/1.0";

    if (!shopId || !apiToken) {
      return res.status(500).json({
        error: "Missing Printify environment variables",
        required: ["PRINTIFY_SHOP_ID", "PRINTIFY_API_TOKEN"]
      });
    }

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "User-Agent": userAgent
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

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
