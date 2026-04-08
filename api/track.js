export default async function handler(req, res) {

  const { id } = req.query;

  const response = await fetch(
    `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/orders/${id}.json`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`
      }
    }
  );

  const data = await response.json();

  res.status(200).json({
    status: data.status,
    tracking: data.shipments?.[0]?.tracking_number || null
  });
}
