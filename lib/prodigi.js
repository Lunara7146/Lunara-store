// /lib/prodigi.js

export async function sendToProdigi(order) {
  const PRODIGI_API_KEY = process.env.PRODIGI_API_KEY;

  const prodigiOrder = {
    recipient: {
      name: `${order.shipping.firstName} ${order.shipping.lastName}`,
      address: {
        line1: order.shipping.address1,
        townOrCity: order.shipping.city,
        postalOrZipCode: order.shipping.zip,
        countryCode: order.shipping.country,
      },
      email: order.email,
    },

    items: order.items.map(item => ({
      sku: item.prodigiSku,
      copies: item.quantity,

      // 🔥 THIS IS THE IMPORTANT PART (ARTWORK)
      assets: [
        {
          printArea: item.printArea || "front",
          url: item.designUrl, // must be PUBLIC URL
        }
      ]
    }))
  };

  const response = await fetch("https://api.prodigi.com/v4.0/orders", {
    method: "POST",
    headers: {
      "X-API-Key": PRODIGI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prodigiOrder),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Prodigi error:", data);
    throw new Error("Prodigi order failed");
  }

  return data;
}
