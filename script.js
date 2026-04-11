// ==========================
// 🌍 GEO DETECTION
// ==========================
let userCountry = "ZA";

async function detectCountry() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    userCountry = data.country_code || "ZA";
  } catch {
    userCountry = "ZA";
  }
}

// ==========================
// 🧠 STATE
// ==========================
let cart = JSON.parse(localStorage.getItem("lunaraCart")) || [];
let favorites = JSON.parse(localStorage.getItem("lunaraFavorites")) || [];
let storeProducts = [];

// ==========================
// ⚙️ HELPERS
// ==========================
function saveCart() {
  localStorage.setItem("lunaraCart", JSON.stringify(cart));
}

function saveFavorites() {
  localStorage.setItem("lunaraFavorites", JSON.stringify(favorites));
}

function formatCurrency(amount) {
  return "R" + Number(amount || 0).toFixed(2);
}

// ==========================
// 🛍️ DISPLAY PRODUCTS
// ==========================
const productsContainer = document.querySelector(".products");

function displayProducts(products) {
  if (!productsContainer) return;

  productsContainer.innerHTML = "";

  if (!products.length) {
    productsContainer.innerHTML = `<p>No products found.</p>`;
    return;
  }

  products.forEach((product, index) => {

    const stock = Math.floor(Math.random() * 6) + 3;
    const reviews = Math.floor(Math.random() * 1500) + 300;
    const isFav = favorites.includes(product.id);

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${product.image}" class="product-image" alt="${product.name}">
      </div>

      <div class="product-info">

        <div class="product-top">
          <h4>${product.name}</h4>
          <button class="fav-btn ${isFav ? "active" : ""}" onclick="toggleFavorite('${product.id}', this)">
            🦋
          </button>
        </div>

        <p class="product-price">${formatCurrency(product.price)}</p>

        <p class="product-tag">🔥 Almost sold out</p>
        <p class="product-stock">Only ${stock} left</p>
        <p class="product-reviews">★★★★★ (${reviews})</p>

        <select id="size-${index}">
          <option>S</option>
          <option>M</option>
          <option>L</option>
          <option>XL</option>
        </select>

        <button onclick="addToCart(${index}, event)">
          Add to Cart →
        </button>

      </div>
    `;

    productsContainer.appendChild(card);
  });
}

// ==========================
// ❤️ FAVORITES
// ==========================
function toggleFavorite(id, el) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
    el.classList.remove("active");
  } else {
    favorites.push(id);
    el.classList.add("active");
  }
  saveFavorites();
}

// ==========================
// 🛒 ADD TO CART (FIXED)
// ==========================
function addToCart(index, event) {
  const product = storeProducts[index];
  const size = document.getElementById(`size-${index}`)?.value || "M";

  if (!product.printify && !product.prodigi) {
    alert("This product is currently unavailable.");
    return;
  }

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

      // 🔥 CRITICAL DATA
      type: product.type,
      printify: product.printify,
      prodigi: product.prodigi
    });
  }

  saveCart();
  updateCart();
  openCart();

  if (event?.target) {
    const btn = event.target;
    btn.innerText = "Added ✓";
    btn.style.background = "var(--success)";
    setTimeout(() => {
      btn.innerText = "Add to Cart →";
      btn.style.background = "";
    }, 1200);
  }
}

// ==========================
// 🧾 CART
// ==========================
function updateCart() {
  const items = document.getElementById("cart-items");
  if (!items) return;

  items.innerHTML = "";

  if (!cart.length) {
    items.innerHTML = `<p>Your cart is empty.</p>`;
    document.getElementById("cart-total").innerText = "R0.00";
    return;
  }

  cart.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div>
        <h5>${item.name}</h5>
        <p>Size: ${item.size}</p>
        <p>Qty: ${item.quantity}</p>
      </div>

      <div>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
        <br>
        <button onclick="removeFromCart(${i})">Remove</button>
      </div>
    `;

    items.appendChild(row);
  });

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  document.getElementById("cart-total").innerText = formatCurrency(total);

  const count = document.getElementById("cart-count");
  if (count) {
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    count.innerText = totalItems;
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCart();
}

// ==========================
// 🛒 CART UI
// ==========================
function openCart() {
  document.getElementById("cart-panel")?.classList.add("open");
}
function closeCart() {
  document.getElementById("cart-panel")?.classList.remove("open");
}

// ==========================
// 💳 CHECKOUT (FIXED)
// ==========================
async function checkout() {

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const firstName = document.getElementById("customer-first-name").value;
  const lastName = document.getElementById("customer-last-name").value;
  const email = document.getElementById("customer-email").value;

  if (!firstName || !lastName || !email) {
    alert("Please fill in your details.");
    return;
  }

  const phone = document.getElementById("customer-phone").value;
  const address1 = document.getElementById("customer-address1").value;
  const city = document.getElementById("customer-city").value;
  const region = document.getElementById("customer-region").value;
  const zip = document.getElementById("customer-zip").value;
  const country = document.getElementById("customer-country").value;

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const orderId = "LUNARA-" + Date.now();
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
      cart, // 🔥 FULL CART SENT
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
  window.location.href = data.url;
}

// ==========================
// 📦 LOAD PRODUCTS (FIXED)
// ==========================
async function loadProducts() {
  if (productsContainer) {
    productsContainer.innerHTML = `<p>Loading products...</p>`;
  }

  try {
    const res = await fetch("/api/products");

    if (!res.ok) throw new Error("API failed");

    const data = await res.json();

    storeProducts = data.data; // 🔥 USE BACKEND DIRECTLY

    displayProducts(storeProducts);
    updateCart();

  } catch (err) {
    console.error("Fallback triggered", err);
    storeProducts = [];
    displayProducts(storeProducts);
    updateCart();
  }
}

// ==========================
// 🚀 INIT
// ==========================
async function init() {
  await detectCountry();
  await loadProducts();
  updateCart();
}

init();
