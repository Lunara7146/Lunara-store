// --- STATE ---
let cart = JSON.parse(localStorage.getItem("lunaraCart")) || [];
let activeCategory = "all";
let storeProducts = [];
let favorites = JSON.parse(localStorage.getItem("lunaraFavorites")) || [];

// --- CONSTANTS ---
const fallbackSizes = ["S", "M", "L", "XL"];
const productsContainer = document.querySelector(".products");

// --- HELPERS ---
function saveCart() {
  localStorage.setItem("lunaraCart", JSON.stringify(cart));
}

function formatCurrency(amount) {
  return "R" + Number(amount || 0).toFixed(2);
}

// --- DISPLAY PRODUCTS ---
function displayProducts(list) {
  productsContainer.innerHTML = "";

  if (!list.length) {
    productsContainer.innerHTML = `<p>No products found.</p>`;
    return;
  }

  list.forEach((product, index) => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <img src="${product.image}" class="product-image">

      <div class="product-info">
        <h4>${product.name}</h4>
        <p class="product-price">${formatCurrency(product.price)}</p>

        <select id="size-${index}">
          ${fallbackSizes.map(s => `<option>${s}</option>`).join("")}
        </select>

        <button onclick="addToCart(${index}, event)">Add to Cart</button>
      </div>
    `;

    productsContainer.appendChild(div);
  });
}

// --- ADD TO CART (CRITICAL FIX) ---
function addToCart(index, event) {
  const product = storeProducts[index];

  const size = document.getElementById(`size-${index}`)?.value || "M";

  const existing = cart.find(
    item => item.id === product.id && item.size === size
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      size,
      quantity: 1,

      // 🔥 REQUIRED FOR PRINTIFY
      productId: product.productId,
      variantId: product.variantId
    });
  }

  saveCart();
  updateCart();

  if (event?.target) {
    const btn = event.target;
    btn.innerText = "Added ✓";
    setTimeout(() => {
      btn.innerText = "Add to Cart";
    }, 1200);
  }
}

// --- CART ---
function updateCart() {
  const items = document.getElementById("cart-items");
  if (!items) return;

  items.innerHTML = "";

  cart.forEach((item, i) => {
    const row = document.createElement("div");

    row.innerHTML = `
      <p>${item.name} (${item.size}) x${item.quantity}</p>
      <button onclick="removeFromCart(${i})">Remove</button>
    `;

    items.appendChild(row);
  });

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  document.getElementById("cart-total").innerText = formatCurrency(total);
}

function removeFromCart(i) {
  cart.splice(i, 1);
  saveCart();
  updateCart();
}

// --- CHECKOUT (FULLY FIXED) ---
async function checkout() {

  const firstName = document.getElementById("customer-first-name").value;
  const lastName = document.getElementById("customer-last-name").value;
  const email = document.getElementById("customer-email").value;
  const phone = document.getElementById("customer-phone").value;

  const address1 = document.getElementById("customer-address1").value;
  const city = document.getElementById("customer-city").value;
  const region = document.getElementById("customer-region").value;
  const zip = document.getElementById("customer-zip").value;
  const country = document.getElementById("customer-country").value;

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 🔥 CREATE ORDER ID (IMPORTANT)
  const orderId = "LUNARA-" + Date.now();

  // Save for redirect fallback
  localStorage.setItem("lunara_order_id", orderId);

  const res = await fetch("/api/payfast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      amount: total,
      cart,
      address1,
      city,
      region,
      zip,
      country,
      phone,
      orderId
    })
  });

  const data = await res.json();

  // 🔥 REDIRECT TO PAYFAST
  window.location.href = data.url;
}

// --- LOAD PRODUCTS (PRINTIFY READY) ---
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    storeProducts = data.map(p => ({
      id: p.id,
      name: p.title,
      price: p.variants[0].price / 100,
      image: p.images[0].src,

      // 🔥 REQUIRED
      productId: p.id,
      variantId: p.variants[0].id
    }));

  } catch {
    // fallback
    storeProducts = [];
  }

  displayProducts(storeProducts);
  updateCart();
}

// --- INIT ---
loadProducts();
updateCart();
