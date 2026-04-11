import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const token = process.env.PRINTIFY_API_TOKEN;

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Failed to fetch Printify products");
    }

    const products = data.data || [];

    for (const p of products) {
      await supabase.from("products").upsert({
        id: p.id,
        title: p.title,
        images: p.images,
        variants: p.variants
      });
    }

    return res.status(200).json({
      success: true,
      count: products.length
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
