export default async function handler(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      amount,
      cart,
      address1,
      city,
      region,
      zip,
      country,
      phone,
      orderId
    } = req.body;

    // ==========================
    // 🧠 ROUTING LOGIC
    // ==========================
    const isSouthAfrica = country === "ZA";

    console.log("Routing order:", {
      orderId,
      country,
      destination: isSouthAfrica ? "PRODIGI" : "PRINTIFY"
    });

    // ==========================
    // 📦 SEND ORDER (BACKGROUND)
    // ==========================
    if (isSouthAfrica) {
      // 👉 Send to Prodigi
      await fetch(`${process.env.VERCEL_URL}/api/prodigi-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId,
          items: cart,
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
    } else {
      // 👉 Send to Printify
      await fetch(`${process.env.VERCEL_URL}/api/printify-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId,
          items: cart,
          shipping: {
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            address1,
            city,
            region,
            zip,
            country
          }
        })
      });
    }

    // ==========================
    // 💳 PAYFAST REDIRECT
    // ==========================
    const paymentUrl = `https://www.payfast.co.za/eng/process?amount=${amount}&item_name=${orderId}`;

    return res.status(200).json({ url: paymentUrl });

  } catch (err) {
    console.error("PayFast error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
}
