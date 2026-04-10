import crypto from "crypto";

let processedOrders = new Set(); // prevent duplicates

export default async function handler(req, res) {
  try {
    const data = req.body;

    console.log("🔔 PayFast ITN received");

    // ==========================
    // 🔐 STEP 1: VALIDATE SIGNATURE
    // ==========================
    const passphrase = process.env.PAYFAST_PASSPHRASE || "";

    const pfData = { ...data };
    const receivedSignature = pfData.signature;
    delete pfData.signature;

    const sortedKeys = Object.keys(pfData).sort();

    const queryString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(pfData[key]).replace(/%20/g, "+")}`)
      .join("&");

    const signatureString = passphrase
      ? `${queryString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
      : queryString;

    const generatedSignature = crypto
      .createHash("md5")
      .update(signatureString)
      .digest("hex");

    if (generatedSignature !== receivedSignature) {
      console.error("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    // ==========================
    // 🌐 STEP 2: VERIFY WITH PAYFAST
    // ==========================
    const verifyRes = await fetch("https://www.payfast.co.za/eng/query/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: queryString
    });

    const verifyText = await verifyRes.text();

    if (verifyText !== "VALID") {
      console.error("❌ PayFast validation failed");
      return res.status(400).send("Validation failed");
    }

    // ==========================
    // 💳 STEP 3: CHECK PAYMENT STATUS
    // ==========================
    if (data.payment_status !== "COMPLETE") {
      console.log("⏳ Payment not complete");
      return res.status(200).send("Ignored");
    }

    const orderId = data.item_name;
    const paidAmount = parseFloat(data.amount_gross);

    // ==========================
    // 🚫 STEP 4: PREVENT DUPLICATES
    // ==========================
    if (processedOrders.has(orderId)) {
      console.log("⚠️ Duplicate order blocked:", orderId);
      return res.status(200).send("Duplicate ignored");
    }

    // ==========================
    // 🧠 STEP 5: GET ORDER DATA
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
      console.error("❌ Order not found:", orderId);
      return res.status(400).send("Order not found");
    }

    const { supplier, cart, customer } = order;

    // ==========================
    // 💰 STEP 6: VERIFY AMOUNT
    // ==========================
    const expectedAmount = cart.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    if (Math.abs(expectedAmount - paidAmount) > 1) {
      console.error("❌ Amount mismatch", { expectedAmount, paidAmount });
      return res.status(400).send("Amount mismatch");
    }

    console.log("✅ Payment verified:", orderId);

    // ==========================
    // 🚚 STEP 7: SEND ORDER
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

    // ==========================
    // ✅ MARK AS PROCESSED
    // ==========================
    processedOrders.add(orderId);

    console.log("🎉 Order completed:", orderId);

    return res.status(200).send("OK");

  } catch (err) {
    console.error("🔥 ITN ERROR:", err);
    return res.status(500).send("Error");
  }
                                          }
