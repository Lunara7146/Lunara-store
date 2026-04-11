<!DOCTYPE html>
<html>
<head>
  <title>Lunara Order Tracking</title>

  <style>
    body {
      font-family: Arial;
      background: #0a0a0a;
      color: white;
      text-align: center;
      padding: 40px;
    }

    h1 {
      margin-bottom: 20px;
    }

    input, button {
      padding: 12px;
      margin: 10px;
      border-radius: 8px;
      border: none;
    }

    button {
      background: #7c3aed;
      color: white;
      cursor: pointer;
    }

    .card {
      margin-top: 30px;
      padding: 25px;
      border-radius: 16px;
      background: #111;
      max-width: 420px;
      margin-left: auto;
      margin-right: auto;
      box-shadow: 0 0 20px rgba(124, 58, 237, 0.2);
    }

    .status {
      font-size: 18px;
      margin: 10px 0;
    }

    .timeline {
      margin-top: 20px;
      text-align: left;
    }

    .step {
      padding: 8px 0;
      opacity: 0.4;
      transition: 0.3s;
    }

    .step.active {
      opacity: 1;
      color: #22c55e;
    }

    a {
      color: #7c3aed;
    }
  </style>
</head>

<body>

  <h1>Track Your Order</h1>

  <input id="orderId" placeholder="Enter Order ID" />
  <br>
  <button onclick="trackOrder()">Track</button>

  <div id="result"></div>

  <script>
    const steps = ["pending", "paid", "fulfilled"];

    function renderTimeline(status) {
      return `
        <div class="timeline">
          ${steps.map(step => `
            <div class="step ${steps.indexOf(step) <= steps.indexOf(status) ? "active" : ""}">
              ${step.toUpperCase()}
            </div>
          `).join("")}
        </div>
      `;
    }

    async function loadPrintifyStatus(orderId) {
      try {
        const res = await fetch(`/api/printify-status?id=${orderId}`);
        const data = await res.json();

        if (!data.success) return "";

        return `
          <div style="margin-top:15px;">
            <p><strong>Fulfillment Status:</strong> ${data.status}</p>
            ${
              data.tracking_number
                ? `<p>Tracking: <a href="${data.tracking_url}" target="_blank">${data.tracking_number}</a></p>`
                : `<p>No tracking yet</p>`
            }
          </div>
        `;
      } catch (err) {
        console.error("Printify status error:", err);
        return "";
      }
    }

    async function trackOrder() {
      const orderId = document.getElementById("orderId").value.trim();

      if (!orderId) return;

      const result = document.getElementById("result");
      result.innerHTML = "<p>Loading...</p>";

      try {
        const res = await fetch(`/api/order-status?orderId=${orderId}`);
        const data = await res.json();

        if (!data.success) {
          result.innerHTML = `<p>Order not found</p>`;
          return;
        }

        const order = data.order;

        // 🔥 Get live Printify data
        const printifyData = await loadPrintifyStatus(order.id);

        result.innerHTML = `
          <div class="card">
            <h2>${order.id}</h2>
            <div class="status">Status: ${order.status}</div>
            <div>Provider: ${order.provider}</div>
            <div>Total: R${order.amount}</div>

            ${renderTimeline(order.status)}

            ${printifyData}
          </div>
        `;
      } catch (err) {
        console.error(err);
        result.innerHTML = `<p>Error loading order</p>`;
      }
    }

    // 🔥 AUTO LOAD AFTER CHECKOUT
    const params = new URLSearchParams(window.location.search);
    const autoOrder = params.get("order");

    if (autoOrder) {
      document.getElementById("orderId").value = autoOrder;
      trackOrder();
    }
  </script>

</body>
</html>
