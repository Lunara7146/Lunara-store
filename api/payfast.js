export default async function handler(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      amount,
      cart,
      supplier,
      address1,
      city,
      region,
      zip,
      country,
      phone,
      orderId
    } = req.body;

    if (!cart || !cart.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 🧠 STORE ORDER TEMPORARILY (VERY IMPORTANT)
    // In production → use DB (for now we simulate)
    await fetch(`${req.headers.origin}/api/store-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId,
        cart,
        supplier,
        customer: {
          firstName,
          lastName,
          email,
          address1,
          city,
          region,
          zip,
          country,
          phone
        }
      })
    });

    // 💳 PAYFAST REDIRECT
    const paymentUrl = `https://www.payfast.co.za/eng/process?amount=${amount}&item_name=${orderId}`;

    return res.status(200).json({ url: paymentUrl });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
}
