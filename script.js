let cart = [];

const sizes = ["XS", "S", "M", "L", "XL"];
const colors = ["Black", "White", "Purple", "Blue"];

const products = [
  { name: "Lunar Oversized Hoodie", price: 39.99, image: "./images/lunar-hoodie.png", category: "hoodie" },
  { name: "Galaxy Flow Hoodie", price: 39.95, image: "./images/galaxy-flow-hoodie.png", category: "hoodie" },
  { name: "Cosmic Butterfly Tee", price: 24.99, image: "./images/cosmic-butterfly-tee.png", category: "shirt" },
  { name: "Psychedelic Mushroom Tee", price: 24.85, image: "./images/psychedelic-mushroom-tee.png", category: "shirt" },
  { name: "Trippy Festival Pants", price: 29.95, image: "./images/trippy-festival-pants.png", category: "pants" },
  { name: "Moon Phase Hippie Pants", price: 29.85, image: "./images/moon-phase-hippie-pants.png", category: "pants" }
];

const container = document.querySelector(".products");

function makeProductId(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function displayProducts(list) {
  container.innerHTML = "";

  list.forEach((product) => {
    const productId = makeProductId(product.name);
    const logoPosition =
      product.category === "pants"
        ? "top:10px; right:10px;"
        : "bottom:10px; right:10px;";

    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <img src="./images/logo-small.png" alt="Lunara mini logo" class="product-logo" style="${logoPosition}">
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>

      <select id="size-${productId}">
        ${sizes.map(size => `<option>${size}</option>`).join("")}
      </select>

      <select id="color-${productId}">
        ${colors.map(color => `<option>${color}</option>`).join("")}
      </select>

      <br><br>
      <button onclick="addToCart('${productId}')">Add To Cart</button>
    `;
    container.appendChild(div);
  });
}

function filterProducts(category) {
  if (category === "all") {
    displayProducts(products);
    return;
  }

  const filtered = products.filter(product => product.category === category);
  displayProducts(filtered);
}

function addToCart(productId) {
  const product = products.find(p => makeProductId(p.name) === productId);

  if (!product) return;

  const size = document.getElementById(`size-${productId}`).value;
  const color = document.getElementById(`color-${productId}`).value;

  cart.push({
    name: product.name,
    price: product.price,
    size,
    color
  });

  updateCart();
  openCart();
}

function updateCart() {
  const items = document.getElementById("cart-items");
  items.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    items.innerHTML += `
      <div class="cart-item">
        ${item.name}<br>
        Size: ${item.size} | Color: ${item.color}<br>
        $${item.price.toFixed(2)}
      </div>
    `;
    total += item.price;
  });

  document.getElementById("cart-count").innerText = cart.length;
  document.getElementById("cart-total").innerText = "$" + total.toFixed(2);
}

function openCart() {
  document.getElementById("cart-panel").style.right = "0";
}

function closeCart() {
  document.getElementById("cart-panel").style.right = "-400px";
}

displayProducts(products);
