// --- STATE ---
let cart = JSON.parse(localStorage.getItem("lunaraCart")) || [];
let activeCategory = "all";
let storeProducts = [];
let favorites = JSON.parse(localStorage.getItem("lunaraFavorites")) || [];
let appliedPromo = null;

// --- CONSTANTS ---
const fallbackSizes = ["XS", "S", "M", "L", "XL"];
const fallbackColors = ["black", "white"];

const promoCodes = {
  LUNARA15: { code: "LUNARA15", type: "percent", value: 15, label: "15% off" }
};

const productsContainer = document.querySelector(".products");

// --- HELPERS ---
function saveCart() {
  localStorage.setItem("lunaraCart", JSON.stringify(cart));
}

function formatCurrency(amount) {
  return "R" + Number(amount || 0).toFixed(2);
}

function formatColorName(color) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function generateStock() {
  return Math.floor(Math.random() * 8) + 3; // FOMO: 3–10 left
}

function getDisplayedProducts() {
  if (activeCategory === "all") return storeProducts;
  if (activeCategory === "favorites") {
    return storeProducts.filter(p => favorites.includes(p.id));
  }
  return storeProducts.filter(p => p.category === activeCategory);
}

// --- DISPLAY PRODUCTS ---
function displayProducts(list) {
  productsContainer.innerHTML = "";

  if (!list.length) {
    productsContainer.innerHTML = `<p class="empty-cart">No products found.</p>`;
    return;
  }

  list.forEach((product, index) => {
    const stock = generateStock();
    const fakeReviews = Math.floor(Math.random() * 2000) + 500;

    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <div class="product-image-wrap">
        <img src="${product.images.black}" class="product-image">
      </div>

      <div class="product-info">
        <h4>${product.name}</h4>
        <p class="product-price">${formatCurrency(product.price)}</p>
        <p class="product-stock">Only ${stock} left</p>
        <p class="product-reviews">★★★★★ (${fakeReviews})</p>

        <select id="size-${index}">
          ${fallbackSizes.map(s => `<option>${s}</option>`).join("")}
        </select>

        <button onclick="addToCart(${index}, event)">Add to Cart</button>
      </div>
    `;

    productsContainer.appendChild(div);
  });
}

// --- ADD TO CART (OPTIMIZED) ---
function addToCart(index, event) {
  const product = getDisplayedProducts()[index];
  if (!product) return;

  const size = document.getElementById(`size-${index}`)?.value || "M";

  const existingItem = cart.find(item =>
    item.id === product.id && item.size === size
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      size,
      quantity: 1
    });
  }

  saveCart();
  updateCart();
  openCart();

  // 🔥 Button feedback
  if (event?.target) {
    const btn = event.target;
    btn.innerText = "Added ✓";
    btn.style.background = "var(--success)";
    setTimeout(() => {
      btn.innerText = "Add to Cart";
      btn.style.background = "";
    }, 1200);
  }
}

// --- CART LOGIC ---
function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCart() {
  saveCart();

  const items = document.getElementById("cart-items");
  if (!items) return;

  items.innerHTML = "";

  if (!cart.length) {
    items.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
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

  const total = getCartSubtotal();

  document.getElementById("cart-total").innerText = formatCurrency(total);

  const count = document.getElementById("cart-count");
  if (count) {
    count.innerText = cart.length;
    count.classList.add("pulse");
    setTimeout(() => count.classList.remove("pulse"), 300);
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// --- CART UI ---
function openCart() {
  document.getElementById("cart-panel")?.classList.add("open");
  document.body.classList.add("cart-open");
}

function closeCart() {
  document.getElementById("cart-panel")?.classList.remove("open");
  document.body.classList.remove("cart-open");
}

// --- FILTER ---
function filterProducts(category) {
  activeCategory = category;
  requestAnimationFrame(() => {
    displayProducts(getDisplayedProducts());
  });
}

// --- LOAD PRODUCTS (LOCAL ONLY SIMPLIFIED) ---
function loadProducts() {
  storeProducts = [
    {
      id: "1",
      name: "Moon Phase Hoodie",
      category: "hoodie",
      price: 39.99,
      images: { black: "images/hoodies/lunar-hoodie-black.png" }
    },
    {
      id: "2",
      name: "Butterfly Tee",
      category: "shirt",
      price: 24.99,
      images: { black: "images/shirts/butterfly-tee-black.png" }
    }
  ];

  displayProducts(getDisplayedProducts());
  updateCart();
}

// --- INIT ---
loadProducts();
updateCart();
/* Header layout */
.site-header {
  position: sticky;
  top: 0;
  background: #000;
  z-index: 1000;
  padding: 10px 20px;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

/* LEFT: Logo */
.logo-left {
  display: flex;
  align-items: center;
}

.logo {
  height: 35px; /* smaller logo */
  width: auto;
}

/* CENTER: Brand name */
.brand-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.brand-center h1 {
  font-size: 22px;
  letter-spacing: 3px;
  margin: 0;
  color: #fff;
}

/* RIGHT: Nav + Cart */
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.main-nav a {
  color: #fff;
  text-decoration: none;
  margin-right: 15px;
  font-size: 14px;
}

.cart-btn {
  background: #fff;
  color: #000;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
    }
// Header shrink on scroll
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");

  if (window.scrollY > 50) {
    header.classList.add("shrink");
  } else {
    header.classList.remove("shrink");
  }
});
