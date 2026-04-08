// =========================
// STATE
// =========================
let cart = JSON.parse(localStorage.getItem("lunaraCart")) || [];
let favorites = JSON.parse(localStorage.getItem("lunaraFavorites")) || [];
let storeProducts = [];

// =========================
// HELPERS
// =========================
function saveCart() {
  localStorage.setItem("lunaraCart", JSON.stringify(cart));
}

function saveFavorites() {
  localStorage.setItem("lunaraFavorites", JSON.stringify(favorites));
}

function formatCurrency(amount) {
  return "R" + Number(amount || 0).toFixed(2);
}

// =========================
// LOAD PRODUCTS (PRINTIFY)
// =========================
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    // IMPORTANT: backend already formatted
    storeProducts = data;

    displayProducts(storeProducts);
    updateCart();
  } catch (err) {
    console.error("❌ Failed to load products:", err);
  }
}

// =========================
// DISPLAY PRODUCTS
// =========================
function displayProducts(products) {
  const container = document.querySelector(".products");
  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach((product, index) => {
    const isFav = favorites.includes(product.id);

    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <div class="product-image-wrap">
        <img src="${product.images.black}" class="product-image">
      </div>

      <div class="product-info">
        <h4>${product.name}</h4>
        <p class="product-price">${formatCurrency(product.price)}</p>

        <span class="wishlist-btn" onclick="toggleFavorite('${product.id}')">
          ${isFav ? "💜" : "🦋"}
        </span>

        <button onclick="addToCart(${index}, event)">
          Add to Cart
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}

// =========================
// FAVORITES (WISHLIST)
// =========================
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }

  saveFavorites();
  displayProducts(storeProducts);
}

// =========================
// ADD TO CART
// =========================
function addToCart(index, event) {
  const product = storeProducts[index];

  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  saveCart();
  updateCart();
  openCart();

  // Button feedback
  if (event?.target) {
    const btn = event.target;
    btn.innerText = "Added ✓";
    setTimeout(() => {
      btn.innerText = "Add to Cart";
    }, 1000);
  }
}

// =========================
// CART LOGIC
// =========================
function updateCart() {
  saveCart();

  const itemsContainer = document.getElementById("cart-items");
  if (!itemsContainer) return;

  itemsContainer.innerHTML = "";

  if (!cart.length) {
    itemsContainer.innerHTML = "<p>Your cart is empty.</p>";
    document.getElementById("cart-total").innerText = "R0.00";
    document.getElementById("cart-count").innerText = "0";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div>
        <h5>${item.name}</h5>
        <p>Qty: ${item.quantity}</p>
      </div>
      <div>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
        <br>
        <button onclick="removeFromCart(${index})">Remove</button>
      </div>
    `;

    itemsContainer.appendChild(row);
  });

  document.getElementById("cart-total").innerText = formatCurrency(total);
  document.getElementById("cart-count").innerText = cart.length;
}

// =========================
// REMOVE FROM CART
// =========================
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// =========================
// CART UI
// =========================
function openCart() {
  document.getElementById("cart-panel")?.classList.add("open");
}

function closeCart() {
  document.getElementById("cart-panel")?.classList.remove("open");
}

// =========================
// HEADER SHRINK ON SCROLL
// =========================
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");

  if (window.scrollY > 50) {
    header.classList.add("shrink");
  } else {
    header.classList.remove("shrink");
  }
});

// =========================
// INIT
// =========================
loadProducts();
updateCart();
