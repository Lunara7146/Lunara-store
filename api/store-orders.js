let orders = {};

export default function handler(req, res) {
  const { orderId, ...rest } = req.body;
  orders[orderId] = rest;
  res.status(200).json({ success: true });
}
