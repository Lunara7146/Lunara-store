let orders = {};

export default function handler(req, res) {
  const { orderId } = req.body;
  res.status(200).json(orders[orderId] || null);
}
