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
// 🏪 LOCAL FALLBACK PRODUCTS
// These products will still show in your store
// even if Printify does not return them
// ==========================
const localProducts = [
  // HOODIES
  {
    id: "butterfly-hoodie",
    name: "Butterfly Hoodie",
    type: "hoodie",
    slug: "butterfly-hoodie",
    price: 599,
    printify: true,
    prodigi: true
  },
  {
    id: "cosmic-eye-hoodie",
    name: "Cosmic Eye Hoodie",
    type: "hoodie",
    slug: "cosmic-eye-hoodie",
    price: 599,
    printify: true,
    prodigi: true
  },
  {
    id: "drip-smile-hoodie",
    name: "Drip Smile Hoodie",
    type: "hoodie",
    slug: "drip-smile-hoodie",
    price: 599,
    printify: true,
    prodigi: true
  },
  {
    id: "galaxy-hoodie",
    name: "Galaxy Hoodie",
    type: "hoodie",
    slug: "galaxy-hoodie",
    price: 599,
    printify: true,
    prodigi: true
  },
  {
    id: "lotus-hoodie",
    name: "Lotus Hoodie",
    type: "hoodie",
    slug: "lotus-hoodie",
    price: 599,
    printify: true,
    prodigi: true
  },
  {
    id: "lunar-hoodie",
    name: "Lunar Hoodie",
    type: "hoodie",
    slug: "lunar-hoodie",
    price: 599,
    printify: true,
    prodigi: true
  },
  {
    id: "mushroom-hoodie",
    name: "Mushroom Hoodie",
    type: "hoodie",
    slug: "mushroom-hoodie",
    price: 599,
    printify: true,
    prodigi: true
  },

  // PANTS
  {
    id: "cosmic-butterfly-pants",
    name: "Cosmic Butterfly Pants",
    type: "pants",
    slug: "cosmic-butterfly-pants",
    price: 499,
    printify: true,
    prodigi: false
  },
  {
    id: "moon-phase-hippie-pants",
    name: "Moon Phase Hippie Pants",
    type: "pants",
    slug: "moon-phase-hippie-pants",
    price: 499,
    printify: true,
    prodigi: false
  },
  {
    id: "psychedelic-mushroom",
    name: "Psychedelic Mushroom Pants",
    type: "pants",
    slug: "psychedelic-mushroom",
    price: 499,
    printify: true,
    prodigi: false
  },
  {
    id: "trippy-festival-pants",
    name: "Trippy Festival Pants",
    type: "pants",
    slug: "trippy-festival-pants",
    price: 499,
    printify: true,
    prodigi: false
  }
];

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

function getSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/t-shirt/g, "tee")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getTypeFolder(product) {
  const type = String(product?.type || "").toLowerCase();

  if (type === "tshirt" || type === "shirt" || type === "tee") {
    return "shirts";
  }

  if (type === "hoodie") {
    return "hoodies";
  }

  return "pants";
}

function getImagePath(product, color = "black") {
  const slug = product.slug || getSlug(product.name);
  const typeFolder = getTypeFolder(product);

  return `/images/${typeFolder}/${slug}/${color}.png`;
}

function normalizeApiProduct(product = {}) {
  const rawType = String(product.type || product.category || "").toLowerCase();
  const rawName = String(product.name || "").toLowerCase();

  let normalizedType = "tshirt";

  if (rawType.includes("hoodie") || rawName.includes("hoodie")) {
    normalizedType = "hoodie";
  } else if (rawType.includes("pant") || rawName.includes("pant")) {
    normalizedType = "pants";
  } else if (
    rawType.includes("shirt") ||
    rawType.includes("tee") ||
    rawName.includes("shirt") ||
    rawName.includes("tee")
  ) {
    normalizedType = "tshirt";
  }

  return {
    ...product,
    id: product.id || product.slug || getSlug(product.name || "product"),
    slug: product.slug || getSlug(product.name || "product"),
    type: normalizedType,
    price: Number(product.price || product.variants?.[0]?.price || 199),
    printify: product.printify ?? true,
    prodigi: product.prodigi ?? false
  };
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

    const defaultColor = "black";
    const image = getImagePath(product, defaultColor);
    const price = Number(product.price || product.variants?.[0]?.price || 199);

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image-wrap">
        <img
          id="img-${index}"
          src="${image}"
          class="product-image"
          alt="${product.name}"
          onerror="this.onerror=null;this.src='${getImagePath(product, "white")}'"
        >
      </div>

      <div class="product-info">
        <div class="product-top">
          <h4>${product.name}</h4>
          <button class="fav-btn ${isFav ? "active" : ""}" onclick="toggleFavorite('${product.id}', this)">
            🦋
          </button>
        </div>

        <p class="product-price">${formatCurrency(price)}</p>
        <p class="product-tag">🔥 Almost sold out</p>
        <p class="product-stock">Only ${stock} left</p>
        <p class="product-reviews">★★★★★ (${reviews})</p>

        <select id="size-${index}">
          <option value="S">S</option>
          <option value="M" selected>M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>

        <select id="color-${index}" onchange="changeColor(${index})">
          <option value="black" selected>Black</option>
          <option value="white">White</option>
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
// 🎨 COLOR SWITCHING
// ==========================
function changeColor(index) {
  const product = storeProducts[index];
  const color = document.getElementById(`color-${index}`)?.value || "black";
  const img = document.getElementById(`img-${index}`);

  if (img && product) {
    img.src = getImagePath(product, color);
  }
}

// ==========================
// ❤️ FAVORITES
// ==========================
function toggleFavorite(id, el) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((f) => f !== id);
    el.classList.remove("active");
  } else {
    favorites.push(id);
    el.classList.add("active");
  }

  saveFavorites();
}

// ==========================
// 🛒 ADD TO CART
// ==========================
function addToCart(index, event) {
  const product = storeProducts[index];
  if (!product) return;

  const size = document.getElementById(`size-${index}`)?.value || "M";
  const color = document.getElementById(`color-${index}`)?.value || "black";
  const image = getImagePath(product, color);

  if (!product.printify && !product.prodigi) {
    alert("This product is currently unavailable.");
    return;
  }

  const existing = cart.find(
    (item) =>
      item.id === product.id &&
      item.size === size &&
      item.color === color
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || product.variants?.[0]?.price || 199),
      size,
      color,
      quantity: 1,
      type: product.type,
      slug: product.slug,
      printify: product.printify,
      prodigi: product.prodigi,
      designUrl: image
    });
  }

  saveCart();
  updateCart();
  openCart();

  if (event?.target) {
    const btn = event.target;
    const originalText = btn.innerText;

    btn.innerText = "Added ✓";
    btn.style.background = "var(--success)";

    setTimeout(() => {
      btn.innerText = originalText || "Add to Cart →";
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

    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.innerText = "R0.00";

    const count = document.getElementById("cart-count");
    if (count) count.innerText = "0";

    return;
  }

  cart.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div>
        <h5>${item.name}</h5>
        <p>Size: ${item.size}</p>
        <p>Color: ${item.color}</p>
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
  const totalEl = document.getElementById("cart-total");
  if (totalEl) totalEl.innerText = formatCurrency(total);

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
// 💳 CHECKOUT
// ==========================
async function checkout() {
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const firstName = document.getElementById("customer-first-name")?.value;
  const lastName = document.getElementById("customer-last-name")?.value;
  const email = document.getElementById("customer-email")?.value;

  if (!firstName || !lastName || !email) {
    alert("Please fill in your details.");
    return;
  }

  const phone = document.getElementById("customer-phone")?.value;
  const address1 = document.getElementById("customer-address1")?.value;
  const city = document.getElementById("customer-city")?.value;
  const region = document.getElementById("customer-region")?.value;
  const zip = document.getElementById("customer-zip")?.value;
  const country = document.getElementById("customer-country")?.value;

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

  if (!res.ok || !data.url) {
    console.error("Checkout failed:", data);
    alert("Checkout failed. Please try again.");
    return;
  }

  window.location.href = data.url;
}

// ==========================
// 📦 LOAD PRODUCTS
// ==========================
async function loadProducts() {
  if (productsContainer) {
    productsContainer.innerHTML = `<p>Loading products...</p>`;
  }

  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "API failed");
    }

    const apiProducts = Array.isArray(data.data)
      ? data.data.map(normalizeApiProduct)
      : [];

    const apiIds = new Set(apiProducts.map((p) => p.id));

    const mergedProducts = [
      ...apiProducts,
      ...localProducts.filter((p) => !apiIds.has(p.id))
    ];

    storeProducts = mergedProducts;
    displayProducts(storeProducts);
    updateCart();
  } catch (err) {
    console.error("Fallback triggered", err);

    storeProducts = [...localProducts];
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
