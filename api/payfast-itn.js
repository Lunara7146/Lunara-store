export default async function handler(req, res) {
  try {
    const data = req.body;

    const paymentStatus = data.payment_status;
    const orderId = data.item_name;

    console.log("PayFast ITN:", data);

    // ✅ Only continue if payment is COMPLETE
    if (paymentStatus !== "COMPLETE") {
      return res.status(200).send("Ignored");
    }

    // ==========================
    // 🧠 GET STORED ORDER
    // ==========================
    const orderRes = await fetch(`${req.headers.origin}/api/get-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId })
    });

    const order = await orderRes.json();

    if (!order) {
      console.error("Order not found:", orderId);
      return res.status(400).send("Order not found");
    }

    const { supplier, cart, customer } = order;

    console.log("Processing paid order:", orderId, supplier);

    // ==========================
    // 🚚 SEND TO SUPPLIER
    // ==========================
    if (supplier === "prodigi") {

      await fetch(`${req.headers.origin}/api/prodigi-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId,
          items: cart,
          customer
        })
      });

    } else {

      await fetch(`${req.headers.origin}/api/printify-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId,
          items: cart,
          shipping: {
            first_name: customer.firstName,
            last_name: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            address1: customer.address1,
            city: customer.city,
            region: customer.region,
            zip: customer.zip,
            country: customer.country
          }
        })
      });
    }

    return res.status(200).send("OK");

  } catch (err) {
    console.error("ITN error:", err);
    return res.status(500).send("Error");
  }
}
