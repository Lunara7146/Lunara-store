/**
 * LUNARA - Official Store Script
 * Includes: Butterfly Animation, Printify Integration, Cart System, and PayFast Checkout
 */

// 🦋 1. BUTTERFLY ANIMATION & INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  const butterfly = document.getElementById('butterfly');
  const introSeen = sessionStorage.getItem('lunara_butterfly_landed');

  if (butterfly) {
    if (!introSeen) {
      // First time visit in this session: Play Animation
      butterfly.classList.add('fluttering');

      // After 5 seconds, switch to resting state
      setTimeout(() => {
        butterfly.classList.remove('fluttering');
        butterfly.classList.add('resting');
        sessionStorage.setItem('lunara_butterfly_landed', 'true');
      }, 5000);
    } else {
      // Returning in the same session: Butterfly is already on the moon
      butterfly.classList.add('resting');
    }
  }

  // Load store data
  loadProducts();
  restorePromoUI();
});

// 🛍️ 2. GLOBAL STORE STATE
let cart = JSON.parse(localStorage.getItem("lunaraCart")) || [];
let activeCategory = "all";
let storeProducts = [];
let appliedDiscountRate = Number(localStorage.getItem("lunaraDiscountRate")) || 0;
let appliedPromoCode = localStorage.getItem("lunaraPromoCode") || "";

const fallbackSizes = ["XS", "S", "M", "L", "XL"];
const fallbackColors = ["black", "white"];

// LOCAL CATALOG (Used as fallback if API fails)
const localCatalog = [
  { slug: "lunar-hoodie", name: "Moon Phase Hoodie", category: "hoodie", images: { black: "images/hoodies/lunar-hoodie-black.png", white: "images/hoodies/lunar-hoodie-white.png" } },
  { slug: "galaxy-hoodie", name: "Galaxy Crescent Hoodie", category: "hoodie", images: { black: "images/hoodies/galaxy-hoodie-black.png", white: "images/hoodies/galaxy-hoodie-white.png" } },
  { slug: "butterfly-hoodie", name: "Butterfly Hoodie", category: "hoodie", images: { black: "images/hoodies/butterfly-hoodie-black.png", white: "images/hoodies/butterfly-hoodie-white.png" } },
  { slug: "cosmic-eye-hoodie", name: "Cosmic Eye Hoodie", category: "hoodie", images: { black: "images/hoodies/cosmic-eye-hoodie-black.png", white: "images/hoodies/cosmic-eye-hoodie-white.png" } },
  { slug: "butterfly-tee", name: "Butterfly Tee", category: "shirt", images: { black: "images/shirts/butterfly-tee-black.png", white: "images/shirts/butterfly-tee-white.png" } },
  { slug: "cosmic-splash-tee", name: "Cosmic Splash Tee", category: "shirt", images: { black: "images/shirts/cosmic-tee-black.png", white: "images/shirts/cosmic-tee-white.png" } },
  { slug: "moon-phase-pants", name: "Moon Phase Pants", category: "pants", images: { black: "images/pants/moon-phase-hippie-pants-black.png" } },
  { slug: "cosmic-butterfly-pants", name: "Butterfly Galaxy Pants", category: "pants", images: { black: "images/pants/cosmic-butterfly-pants-black.png" } }
];

const productsContainer = document.querySelector(".products");

// 🛠️ 3. UTILITY FUNCTIONS
function saveCart() { localStorage.setItem("lunaraCart", JSON.stringify(cart)); }
function savePromoState() {
  localStorage.setItem("lunaraDiscountRate", String(appliedDiscountRate));
  localStorage.setItem("lunaraPromoCode", appliedPromoCode);
}
function formatColorName(color) { return color.charAt(0).toUpperCase() + color.slice(1); }
function stripHtml(html = "") {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}
function formatCurrency(amount) { return "R" + Number(amount || 0).toFixed(2); }

// 📦 4. PRODUCT DISPLAY LOGIC
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("API Offline");
    const data = await response.json();
    const apiProducts = Array.isArray(data.data) ? data.data : [];
    storeProducts = apiProducts.map(normalizePrintifyProduct);
  } catch (error) {
    console.log("Loading local catalog...");
    storeProducts = localCatalog.map(product => ({
      id: product.slug,
      name: product.name,
      description: "Lunara statement piece designed to stand out.",
      category: product.category,
      price: product.category === "hoodie" ? 1100 : 450,
      sizes: fallbackSizes,
      images: product.images,
      printifyProductId: "",
      printifyVariantId: ""
    }));
  }
  displayProducts(getDisplayedProducts());
  setActiveFilterButton();
  updateCart();
}

function normalizePrintifyProduct(apiProduct) {
  const title = apiProduct.title || "Lunara Item";
  const firstVar = apiProduct.variants?.[0];
  return {
    id: apiProduct.id,
    name: title,
    description: stripHtml(apiProduct.description),
    category: title.toLowerCase().includes("hoodie") ? "hoodie" : title.toLowerCase().includes("pants") ? "pants" : "shirt",
    price: firstVar ? (firstVar.price / 100) : 450,
    sizes: fallbackSizes,
    images: { black: apiProduct.images?.[0]?.src || "images/logo-small.png" },
    printifyProductId: apiProduct.id,
    printifyVariantId: firstVar?.id || ""
  };
}

function displayProducts(list) {
  if (!productsContainer) return;
  productsContainer.innerHTML = list.map((product, index) => `
    <div class="product-card">
      <div class="product-image-wrap">
        <img id="img-${index}" src="${product.images.black}" alt="${product.name}" class="product-image">
      </div>
      <div class="product-info">
        <p class="product-type">${product.category}</p>
        <h4>${product.name}</h4>
        <p class="product-price">${formatCurrency(product.price)}</p>
        <div class="product-options">
          <select id="size-${index}">${product.sizes.map(s => `<option value="${s}">${s}</option>`).join("")}</select>
          <select id="color-${index}" onchange="changeColor(${index})">
            ${Object.keys(product.images).map(c => `<option value="${c}">${formatColorName(c)}</option>`).join("")}
          </select>
        </div>
        <button onclick="addToCart(${index})">Add to Cart</button>
      </div>
    </div>
  `).join("");
}

// 🛒 5. CART & CHECKOUT LOGIC
window.filterProducts = function(category) {
  activeCategory = category;
  displayProducts(getDisplayedProducts());
  setActiveFilterButton();
};

function getDisplayedProducts() {
  return activeCategory === "all" ? storeProducts : storeProducts.filter(p => p.category === activeCategory);
}

window.changeColor = function(index) {
  const product = getDisplayedProducts()[index];
  const color = document.getElementById(`color-${index}`).value;
  document.getElementById(`img-${index}`).src = product.images[color];
};

window.addToCart = function(index) {
  const product = getDisplayedProducts()[index];
  const size = document.getElementById(`size-${index}`).value;
  const color = document.getElementById(`color-${index}`).value;

  const existing = cart.find(item => item.id === product.id && item.size === size && item.color === color);
  if (existing) { existing.quantity++; } 
  else {
    cart.push({ ...product, size, color: formatColorName(color), quantity: 1 });
  }
  updateCart();
  openCart();
};

window.updateCart = function() {
  const itemsDiv = document.getElementById("cart-items");
  if (!itemsDiv) return;

  itemsDiv.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <div><h5>${item.name}</h5><p>${item.size} | ${item.color} (x${item.quantity})</p></div>
      <div><strong>${formatCurrency(item.price * item.quantity)}</strong><br>
      <button onclick="removeFromCart(${i})">Remove</button></div>
    </div>
  `).join("") || '<p class="empty-cart">Your cart is empty.</p>';

  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const discount = subtotal * appliedDiscountRate;
  
  document.getElementById("cart-count").innerText = cart.reduce((s, i) => s + i.quantity, 0);
  document.getElementById("cart-subtotal").innerText = formatCurrency(subtotal);
  document.getElementById("cart-discount").innerText = "-" + formatCurrency(discount);
  document.getElementById("cart-total").innerText = formatCurrency(subtotal - discount);
  saveCart();
};

window.removeFromCart = function(i) { cart.splice(i, 1); updateCart(); };
window.openCart = function() { document.getElementById("cart-panel").classList.add("open"); document.getElementById("overlay").classList.add("show"); };
window.closeCart = function() { document.getElementById("cart-panel").classList.remove("open"); document.getElementById("overlay").classList.remove("show"); };

window.applyPromoCode = function() {
  const code = document.getElementById("promo-code").value.trim().toUpperCase();
  if (code === "LUNARA15") {
    appliedDiscountRate = 0.15;
    appliedPromoCode = code;
    document.getElementById("promo-message").textContent = "15% discount applied!";
  } else {
    alert("Invalid Code");
  }
  savePromoState();
  updateCart();
};

function restorePromoUI() {
  if (appliedPromoCode) {
    document.getElementById("promo-code").value = appliedPromoCode;
    document.getElementById("promo-message").textContent = appliedPromoCode + " applied.";
  }
}

function setActiveFilterButton() {
  document.querySelectorAll(".filters button").forEach(btn => {
    btn.classList.toggle("active", btn.innerText.toLowerCase() === activeCategory || (activeCategory === 'all' && btn.innerText.toLowerCase() === 'all'));
  });
}

// 💳 6. PAYFAST PREPARATION
window.preparePayFastCheckout = function() {
  if (cart.length === 0) return false;
  
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const total = subtotal - (subtotal * appliedDiscountRate);

  document.getElementById("pf-name-first").value = document.getElementById("customer-first-name").value;
  document.getElementById("pf-name-last").value = document.getElementById("customer-last-name").value;
  document.getElementById("pf-email-address").value = document.getElementById("customer-email").value;
  document.getElementById("pf-amount").value = total.toFixed(2);
  document.getElementById("pf-item-name").value = cart.map(i => i.name).join(", ");
  document.getElementById("pf-payment-id").value = "LUNARA-" + Date.now();

  return true;
};
