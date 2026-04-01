export default async function handler(req, res) {
  try {
    const shopId = "27018221";

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch products",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
