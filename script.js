// --- STATE ---
let cart = JSON.parse(localStorage.getItem("lunaraCart")) || [];
let activeCategory = "all";
let storeProducts = [];
let favorites = JSON.parse(localStorage.getItem("lunaraFavorites")) || [];

// --- CONSTANTS ---
const fallbackSizes = ["XS", "S", "M", "L", "XL"];
const productsContainer = document.querySelector(".products");

// --- HELPERS ---
function saveCart() {
  localStorage.setItem("lunaraCart", JSON.stringify(cart));
}

function formatCurrency(amount) {
  return "R" + Number(amount || 0).toFixed(2);
}

function generateStock() {
  return Math.floor(Math.random() * 8) + 3;
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
    productsContainer.innerHTML = `<p>No products found.</p>`;
    return;
  }

  list.forEach((product, index) => {
    const stock = generateStock();

    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <img src="${product.images.black}" class="product-image">
      <div class="product-info">
        <h4>${product.name}</h4>
        <p class="product-price">${formatCurrency(product.price)}</p>
        <p>Only ${stock} left</p>

        <select id="size-${index}">
          ${fallbackSizes.map(s => `<option>${s}</option>`).join("")}
        </select>

        <button onclick="addToCart(${index}, event)">Add to Cart</button>
      </div>
    `;

    productsContainer.appendChild(div);
  });
}

// --- CART ---
function addToCart(index, event) {
  const product = getDisplayedProducts()[index];
  if (!product) return;

  const size = document.getElementById(`size-${index}`).value;

  const existing = cart.find(item =>
    item.id === product.id && item.size === size
  );

  if (existing) {
    existing.quantity++;
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

  if (event?.target) {
    const btn = event.target;
    btn.innerText = "Added ✓";
    setTimeout(() => (btn.innerText = "Add to Cart"), 1000);
  }
}

function updateCart() {
  saveCart();

  const items = document.getElementById("cart-items");
  if (!items) return;

  items.innerHTML = "";

  if (!cart.length) {
    items.innerHTML = `<p>Your cart is empty.</p>`;
    return;
  }

  cart.forEach((item, i) => {
    const row = document.createElement("div");
    row.innerHTML = `
      <p>${item.name} (${item.size}) x${item.quantity}</p>
      <p>${formatCurrency(item.price * item.quantity)}</p>
      <button onclick="removeFromCart(${i})">Remove</button>
    `;
    items.appendChild(row);
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById("cart-total").innerText = formatCurrency(total);

  document.getElementById("cart-count").innerText = cart.length;
}

function removeFromCart(i) {
  cart.splice(i, 1);
  updateCart();
}

// --- CART UI ---
function openCart() {
  document.getElementById("cart-panel")?.classList.add("open");
}

function closeCart() {
  document.getElementById("cart-panel")?.classList.remove("open");
}

// --- LOAD PRODUCTS (TEMP LOCAL) ---
function loadProducts() {
  storeProducts = [
    {
      id: "1",
      name: "Moon Phase Hoodie",
      category: "hoodie",
      price: 399,
      images: { black: "images/hoodies/lunar-hoodie-black.png" }
    },
    {
      id: "2",
      name: "Butterfly Tee",
      category: "shirt",
      price: 249,
      images: { black: "images/shirts/butterfly-tee-black.png" }
    }
  ];

  displayProducts(getDisplayedProducts());
  updateCart();
}

// --- HEADER SHRINK ---
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");
  if (window.scrollY > 50) {
    header.classList.add("shrink");
  } else {
    header.classList.remove("shrink");
  }
});

// --- INIT ---
loadProducts();
updateCart();
