let cart = [];
let activeCategory = "all";
let storeProducts = [];
let favorites = JSON.parse(localStorage.getItem("lunaraFavorites")) || [];
let appliedPromo = null;

const fallbackSizes = ["XS", "S", "M", "L", "XL"];
const fallbackColors = ["black", "white"];

const promoCodes = {
  LUNARA15: {
    code: "LUNARA15",
    type: "percent",
    value: 15,
    label: "15% off"
  }
};

const localCatalog = [
  {
    slug: "lunar-hoodie",
    name: "Moon Phase Hoodie",
    category: "hoodie",
    images: {
      black: "images/hoodies/lunar-hoodie-black.png",
      white: "images/hoodies/lunar-hoodie-white.png"
    }
  },
  {
    slug: "galaxy-hoodie",
    name: "Galaxy Crescent Hoodie",
    category: "hoodie",
    images: {
      black: "images/hoodies/galaxy-hoodie-black.png",
      white: "images/hoodies/galaxy-hoodie-white.png"
    }
  },
  {
    slug: "butterfly-hoodie",
    name: "Butterfly Hoodie",
    category: "hoodie",
    images: {
      black: "images/hoodies/butterfly-hoodie-black.png",
      white: "images/hoodies/butterfly-hoodie-white.png"
    }
  },
  {
    slug: "cosmic-eye-hoodie",
    name: "Cosmic Eye Hoodie",
    category: "hoodie",
    images: {
      black: "images/hoodies/cosmic-eye-hoodie-black.png",
      white: "images/hoodies/cosmic-eye-hoodie-white.png"
    }
  },
  {
    slug: "drip-smile-hoodie",
    name: "Drip Smile Hoodie",
    category: "hoodie",
    images: {
      black: "images/hoodies/drip-smile-hoodie-black.png"
    }
  },
  {
    slug: "lotus-hoodie",
    name: "Lotus Hoodie",
    category: "hoodie",
    images: {
      black: "images/hoodies/lotus-hoodie-black.png"
    }
  },
  {
    slug: "mushroom-hoodie",
    name: "Mushroom Hoodie",
    category: "hoodie",
    images: {
      black: "images/hoodies/mushroom-hoodie-black.png"
    }
  },
  {
    slug: "butterfly-tee",
    name: "Butterfly Tee",
    category: "shirt",
    images: {
      black: "images/shirts/butterfly-tee-black.png",
      white: "images/shirts/butterfly-tee-white.png"
    }
  },
  {
    slug: "mushroom-tee",
    name: "Mushroom Tee",
    category: "shirt",
    images: {
      black: "images/shirts/mushroom-tee-black.png"
    }
  },
  {
    slug: "cosmic-splash-tee",
    name: "Cosmic Splash Tee",
    category: "shirt",
    images: {
      black: "images/shirts/cosmic-tee-black.png",
      white: "images/shirts/cosmic-tee-white.png"
    }
  },
  {
    slug: "cosmic-eye-tee",
    name: "Cosmic Eye Tee",
    category: "shirt",
    images: {
      black: "images/shirts/eye-tee-black.png",
      white: "images/shirts/eye-tee-white.png"
    }
  },
  {
    slug: "drip-smile-tee",
    name: "Drip Smile Tee",
    category: "shirt",
    images: {
      black: "images/shirts/drip-smile-tee-black.png"
    }
  },
  {
    slug: "moon-phase-pants",
    name: "Moon Phase Pants",
    category: "pants",
    images: {
      black: "images/pants/moon-phase-hippie-pants-black.png"
    }
  },
  {
    slug: "mushroom-pants",
    name: "Mushroom Galaxy Pants",
    category: "pants",
    images: {
      black: "images/pants/mushroom-pants-black.png"
    }
  },
  {
    slug: "cosmic-butterfly-pants",
    name: "Butterfly Galaxy Pants",
    category: "pants",
    images: {
      black: "images/pants/cosmic-butterfly-pants-black.png"
    }
  },
  {
    slug: "trippy-festival-pants",
    name: "Trippy Festival Pants",
    category: "pants",
    images: {
      black: "images/pants/trippy-festival-pants-black.png"
    }
  }
];

const productsContainer = document.querySelector(".products");

function formatColorName(color) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function stripHtml(html = "") {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

function shortenText(text = "", maxLength = 110) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function formatPriceFromCents(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function formatCurrency(amount) {
  return "R" + Number(amount || 0).toFixed(2);
}

function guessCategory(text) {
  const value = text.toLowerCase();

  if (value.includes("hoodie") || value.includes("sweatshirt") || value.includes("crewneck")) {
    return "hoodie";
  }

  if (value.includes("pants") || value.includes("jogger") || value.includes("trouser")) {
    return "pants";
  }

  return "shirt";
}

function findLocalMatch(title, category) {
  const value = title.toLowerCase();

  if (category === "hoodie") {
    if (value.includes("butterfly")) return "butterfly-hoodie";
    if (value.includes("cosmic") && value.includes("eye")) return "cosmic-eye-hoodie";
    if (value.includes("drip") || value.includes("smile")) return "drip-smile-hoodie";
    if (value.includes("galaxy")) return "galaxy-hoodie";
    if (value.includes("lotus")) return "lotus-hoodie";
    if (value.includes("mushroom")) return "mushroom-hoodie";
    if (value.includes("lunar") || value.includes("moon")) return "lunar-hoodie";
  }

  if (category === "shirt") {
    if (value.includes("butterfly")) return "butterfly-tee";
    if (value.includes("mushroom")) return "mushroom-tee";
    if (value.includes("cosmic") && value.includes("eye")) return "cosmic-eye-tee";
    if (value.includes("drip") || value.includes("smile")) return "drip-smile-tee";
    if (value.includes("cosmic") || value.includes("splash")) return "cosmic-splash-tee";
  }

  if (category === "pants") {
    if (value.includes("mushroom")) return "mushroom-pants";
    if (value.includes("butterfly")) return "cosmic-butterfly-pants";
    if (value.includes("trippy") || value.includes("festival")) return "trippy-festival-pants";
    if (value.includes("moon")) return "moon-phase-pants";
  }

  return null;
}

function getLocalCatalogBySlug(slug) {
  return localCatalog.find(item => item.slug === slug) || null;
}

function getDefaultImage(images) {
  if (!images) return "";
  if (images.black) return images.black;
  const firstKey = Object.keys(images)[0];
  return firstKey ? images[firstKey] : "";
}

function getAvailableColors(images) {
  if (!images) return fallbackColors;
  const available = Object.keys(images);
  return available.length ? available : fallbackColors;
}

function getAvailableSizes(product) {
  if (product.sizes && product.sizes.length) {
    return product.sizes;
  }
  return fallbackSizes;
}

function isFavorite(productId) {
  return favorites.includes(productId);
}

function saveFavorites() {
  localStorage.setItem("lunaraFavorites", JSON.stringify(favorites));
}

function toggleFavorite(productId) {
  if (isFavorite(productId)) {
    favorites = favorites.filter(id => id !== productId);
  } else {
    favorites.push(productId);
  }

  saveFavorites();
  displayProducts(getDisplayedProducts());
  setActiveFilterButton();
}

function getDisplayedProducts() {
  if (activeCategory === "all") return storeProducts;
  if (activeCategory === "favorites") {
    return storeProducts.filter(product => isFavorite(product.id));
  }
  return storeProducts.filter(product => product.category === activeCategory);
}

function displayProducts(list) {
  productsContainer.innerHTML = "";

  if (!list.length) {
    const message =
      activeCategory === "favorites"
        ? "No favorites yet. Tap the butterfly to save your favorite pieces."
        : "No products found in this category yet.";

    productsContainer.innerHTML = `<p class="empty-cart">${message}</p>`;
    return;
  }

  list.forEach((product, index) => {
    const availableColors = getAvailableColors(product.images);
    const defaultColor = availableColors.includes("black") ? "black" : availableColors[0];
    const availableSizes = getAvailableSizes(product);
    const safeDescription = shortenText(product.description || "", 120);
    const imageSrc = product.images?.[defaultColor] || getDefaultImage(product.images);

    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <div class="product-image-wrap">
        <button
          class="favorite-btn ${isFavorite(product.id) ? "active" : ""}"
          type="button"
          onclick="toggleFavorite('${product.id}')"
          aria-label="Toggle favorite"
          title="Add to favorites"
        >
          <span class="butterfly-icon">🦋</span>
        </button>

        <img
          id="img-${index}"
          src="${imageSrc}"
          alt="${product.name}"
          class="product-image"
        >
      </div>

      <div class="product-info">
        <p class="product-type">${product.category}</p>
        <h4>${product.name}</h4>
        <p class="product-price">${formatCurrency(product.price)}</p>
        <p class="product-description">${safeDescription}</p>

        <div class="product-options">
          <select id="size-${index}">
            ${availableSizes.map(size => `<option value="${size}">${size}</option>`).join("")}
          </select>

          <select id="color-${index}" onchange="changeColor(${index})">
            ${availableColors.map(color => `
              <option value="${color}" ${color === defaultColor ? "selected" : ""}>
                ${formatColorName(color)}
              </option>
            `).join("")}
          </select>
        </div>

        <button onclick="addToCart(${index})">Add to Cart</button>
      </div>
    `;

    productsContainer.appendChild(div);
  });
}

function filterProducts(category) {
  activeCategory = category;
  displayProducts(getDisplayedProducts());
  setActiveFilterButton();
}

function changeColor(index) {
  const displayedProducts = getDisplayedProducts();
  const product = displayedProducts[index];
  const selectedColor = document.getElementById(`color-${index}`)?.value;
  const image = document.getElementById(`img-${index}`);

  if (!product || !image || !selectedColor) return;

  image.src = product.images[selectedColor] || getDefaultImage(product.images);
}

function addToCart(index) {
  const displayedProducts = getDisplayedProducts();
  const product = displayedProducts[index];

  if (!product) return;

  const size = document.getElementById(`size-${index}`)?.value || "M";
  const color = document.getElementById(`color-${index}`)?.value || "black";

  cart.push({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    size,
    color: formatColorName(color),
    quantity: 1,
    printifyProductId: product.printifyProductId || product.id || "",
    printifyVariantId: product.printifyVariantId || ""
  });

  updateCart();
  openCart();
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity || 1));
  }, 0);
}

function getDiscountAmount(subtotal) {
  if (!appliedPromo) return 0;

  if (appliedPromo.type === "percent") {
    return subtotal * (appliedPromo.value / 100);
  }

  return 0;
}

function applyPromoCode() {
  const promoInput = document.getElementById("promo-code");
  const promoMessage = document.getElementById("promo-message");

  if (!promoInput || !promoMessage) return;

  const enteredCode = promoInput.value.trim().toUpperCase();

  if (!enteredCode) {
    appliedPromo = null;
    promoMessage.textContent = "Enter a promo code.";
    promoMessage.className = "promo-message error";
    updateCart();
    return;
  }

  if (!promoCodes[enteredCode]) {
    appliedPromo = null;
    promoMessage.textContent = "That promo code is not active right now.";
    promoMessage.className = "promo-message error";
    updateCart();
    return;
  }

  appliedPromo = promoCodes[enteredCode];
  promoMessage.textContent = `${appliedPromo.code} applied — ${appliedPromo.label}.`;
  promoMessage.className = "promo-message success";
  updateCart();
}

function updateCart() {
  const items = document.getElementById("cart-items");
  if (!items) return;

  items.innerHTML = "";

  const subtotal = getCartSubtotal();
  const discount = getDiscountAmount(subtotal);
  const total = Math.max(subtotal - discount, 0);

  if (cart.length === 0) {
    items.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
  } else {
    cart.forEach((item, itemIndex) => {
      const quantity = Number(item.quantity || 1);
      const lineTotal = Number(item.price) * quantity;

      const cartRow = document.createElement("div");
      cartRow.className = "cart-item";
      cartRow.innerHTML = `
        <div>
          <h5>${item.name}</h5>
          <p>Size: ${item.size}</p>
          <p>Color: ${item.color}</p>
          <p>Qty: ${quantity}</p>
        </div>
        <div>
          <strong>${formatCurrency(lineTotal)}</strong>
          <br>
          <button type="button" onclick="removeFromCart(${itemIndex})">Remove</button>
        </div>
      `;
      items.appendChild(cartRow);
    });
  }

  const cartCount = document.getElementById("cart-count");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartDiscount = document.getElementById("cart-discount");
  const cartTotal = document.getElementById("cart-total");

  if (cartCount) cartCount.innerText = cart.length;
  if (cartSubtotal) cartSubtotal.innerText = formatCurrency(subtotal);
  if (cartDiscount) cartDiscount.innerText = "-" + formatCurrency(discount);
  if (cartTotal) cartTotal.innerText = formatCurrency(total);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function openCart() {
  document.getElementById("cart-panel")?.classList.add("open");
  document.getElementById("overlay")?.classList.add("show");
}

function closeCart() {
  document.getElementById("cart-panel")?.classList.remove("open");
  document.getElementById("overlay")?.classList.remove("show");
}

function getFieldValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function preparePayFastCheckout() {
  if (!cart || cart.length === 0) {
    alert("Your cart is empty.");
    return false;
  }

  const firstName = getFieldValue("customer-first-name");
  const lastName = getFieldValue("customer-last-name");
  const email = getFieldValue("customer-email");
  const phone = getFieldValue("customer-phone");
  const address1 = getFieldValue("customer-address1");
  const city = getFieldValue("customer-city");
  const region = getFieldValue("customer-region");
  const zip = getFieldValue("customer-zip");
  const country = getFieldValue("customer-country") || "ZA";

  if (!firstName || !lastName || !email || !phone || !address1 || !city || !region || !zip || !country) {
    alert("Please fill in all checkout details before continuing.");
    return false;
  }

  const subtotal = getCartSubtotal();
  const discount = getDiscountAmount(subtotal);
  const total = Math.max(subtotal - discount, 0);

  const itemNames = cart
    .map(item => `${item.name} (${item.size}, ${item.color}) x${item.quantity || 1}`)
    .join(", ");

  const primaryItem = cart[0];
  const orderId = "LUNARA-" + Date.now();

  document.getElementById("pf-name-first").value = firstName;
  document.getElementById("pf-name-last").value = lastName;
  document.getElementById("pf-email-address").value = email;
  document.getElementById("pf-payment-id").value = orderId;
  document.getElementById("pf-amount").value = total.toFixed(2);
  document.getElementById("pf-item-name").value = itemNames;

  document.getElementById("pf-product-id").value = primaryItem.printifyProductId || "";
  document.getElementById("pf-variant-id").value = primaryItem.printifyVariantId || "";
  document.getElementById("pf-quantity").value = primaryItem.quantity || 1;

  document.getElementById("pf-address1").value = address1;
  document.getElementById("pf-city").value = city;
  document.getElementById("pf-region").value = region;
  document.getElementById("pf-zip").value = zip;
  document.getElementById("pf-country").value = country.toUpperCase();
  document.getElementById("pf-phone").value = phone;

  const promoField = document.getElementById("pf-promo-code");
  if (promoField) promoField.value = appliedPromo?.code || "";

  if (!primaryItem.printifyProductId || !primaryItem.printifyVariantId) {
    alert("This product is not fully mapped to Printify yet. Payment can continue, but automatic fulfilment will need the correct product and variant IDs.");
  }

  return true;
}

function setActiveFilterButton() {
  const buttons = document.querySelectorAll(".filters button");

  buttons.forEach(button => {
    button.classList.remove("active");
    const text = button.textContent.toLowerCase();

    if (activeCategory === "all" && text === "all") {
      button.classList.add("active");
    } else if (activeCategory === "favorites" && text === "favorites") {
      button.classList.add("active");
    } else if (text.includes(activeCategory) && activeCategory !== "all" && activeCategory !== "favorites") {
      button.classList.add("active");
    }
  });
}

function normalizePrintifyProduct(apiProduct) {
  const title = apiProduct.title || "Lunara Product";
  const category = guessCategory(title);
  const localSlug = findLocalMatch(title, category);
  const localProduct = localSlug ? getLocalCatalogBySlug(localSlug) : null;

  const firstAvailableVariant =
    (apiProduct.variants || []).find(variant => variant.is_available) ||
    (apiProduct.variants || []).find(variant => variant.is_enabled) ||
    apiProduct.variants?.[0] ||
    null;

  const price = firstAvailableVariant
    ? Number(formatPriceFromCents(firstAvailableVariant.price))
    : 29.99;

  const sizes =
    apiProduct.options?.find(option => {
      const optionName = option.name?.toLowerCase();
      return optionName === "size" || optionName === "sizes";
    })?.values?.map(value => value.title) || fallbackSizes;

  const printifyImage =
    apiProduct.images?.find(image => image.is_default)?.src ||
    apiProduct.images?.[0]?.src ||
    apiProduct.image ||
    "";

  const images = printifyImage
    ? { black: printifyImage }
    : localProduct?.images || { black: "images/lunara-clothing-logo.png" };

  return {
    id: apiProduct.id,
    name: localProduct?.name || title,
    description: stripHtml(apiProduct.description || ""),
    category: localProduct?.category || category,
    price,
    sizes,
    images,
    printifyProductId: apiProduct.id,
    printifyVariantId: firstAvailableVariant?.id || ""
  };
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("Could not load Printify products.");
    }

    const data = await response.json();
    const apiProducts = Array.isArray(data.data) ? data.data : [];

    if (!apiProducts.length) {
      throw new Error("No products returned from Printify.");
    }

    storeProducts = apiProducts.map(normalizePrintifyProduct);
  } catch (error) {
    console.error(error);

    storeProducts = localCatalog.map(product => ({
      id: product.slug,
      name: product.name,
      description: "Lunara statement piece designed to stand out day or night.",
      category: product.category,
      price: product.category === "hoodie" ? 39.99 : product.category === "pants" ? 29.99 : 24.99,
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

document.querySelectorAll(".filters button").forEach(button => {
  button.addEventListener("click", () => {
    setTimeout(setActiveFilterButton, 0);
  });
});

loadProducts();
