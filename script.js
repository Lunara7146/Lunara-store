let cart = [];

const sizes = ["XS", "S", "M", "L", "XL"];
const colors = ["black", "white"];

const products = [
  {
    name: "Moon Phase Hoodie",
    price: 39.99,
    category: "hoodie",
    images: {
      black: "images/hoodies/lunar-hoodie-black.png",
      white: "images/hoodies/lunar-hoodie-white.png"
    }
  },
  {
    name: "Galaxy Crescent Hoodie",
    price: 39.99,
    category: "hoodie",
    images: {
      black: "images/hoodies/galaxy-hoodie-black.png",
      white: "images/hoodies/galaxy-hoodie-white.png"
    }
  },
  {
    name: "Butterfly Hoodie",
    price: 39.99,
    category: "hoodie",
    images: {
      black: "images/hoodies/butterfly-hoodie-black.png",
      white: "images/hoodies/butterfly-hoodie-white.png"
    }
  },
  {
    name: "Cosmic Eye Hoodie",
    price: 39.99,
    category: "hoodie",
    images: {
      black: "images/hoodies/cosmic-eye-hoodie-black.png",
      white: "images/hoodies/cosmic-eye-hoodie-white.png"
    }
  },

  {
    name: "Butterfly Tee",
    price: 24.99,
    category: "shirt",
    images: {
      black: "images/shirts/butterfly-tee-black.png",
      white: "images/shirts/butterfly-tee-white.png"
    }
  },
  {
    name: "Mushroom Tee",
    price: 24.99,
    category: "shirt",
    images: {
      black: "images/shirts/mushroom-tee-black.png",
      white: "images/shirts/mushroom-tee-white.png"
    }
  },
  {
    name: "Cosmic Splash Tee",
    price: 24.99,
    category: "shirt",
    images: {
      black: "images/shirts/cosmic-tee-black.png",
      white: "images/shirts/cosmic-tee-white.png"
    }
  },
  {
    name: "Cosmic Eye Tee",
    price: 24.99,
    category: "shirt",
    images: {
      black: "images/shirts/eye-tee-black.png",
      white: "images/shirts/eye-tee-white.png"
    }
  },

  {
    name: "Moon Phase Pants",
    price: 29.99,
    category: "pants",
    images: {
      black: "images/pants/moon-pants-black.png",
      white: "images/pants/moon-pants-white.png"
    }
  },
  {
    name: "Mushroom Galaxy Pants",
    price: 29.99,
    category: "pants",
    images: {
      black: "images/pants/mushroom-pants-black.png",
      white: "images/pants/mushroom-pants-white.png"
    }
  },
  {
    name: "Cosmic Moon Pants",
    price: 29.99,
    category: "pants",
    images: {
      black: "images/pants/cosmic-pants-black.png",
      white: "images/pants/cosmic-pants-white.png"
    }
  },
  {
    name: "Butterfly Galaxy Pants",
    price: 29.99,
    category: "pants",
    images: {
      black: "images/pants/butterfly-pants-black.png",
      white: "images/pants/butterfly-pants-white.png"
    }
  }
];

const container = document.querySelector(".products");
let activeCategory = "all";

function formatColorName(color) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function displayProducts(list) {
  container.innerHTML = "";

  list.forEach((product, index) => {
    const defaultColor = "black";

    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <div class="product-image-wrap">
        <img
          id="img-${index}"
          src="${product.images[defaultColor]}"
          alt="${product.name}"
          class="product-image"
        >
      </div>

      <div class="product-info">
        <p class="product-type">${product.category}</p>
        <h4>${product.name}</h4>
        <p class="product-price">$${product.price.toFixed(2)}</p>

        <div class="product-options">
          <select id="size-${index}">
            ${sizes.map(size => `<option value="${size}">${size}</option>`).join("")}
          </select>

          <select id="color-${index}" onchange="changeColor(${index})">
            ${colors.map(color => `
              <option value="${color}" ${color === defaultColor ? "selected" : ""}>
                ${formatColorName(color)}
              </option>
            `).join("")}
          </select>
        </div>

        <button onclick="addToCart(${index})">Add to Cart</button>
      </div>
    `;

    container.appendChild(div);
  });
}

function filterProducts(category) {
  activeCategory = category;

  if (category === "all") {
    displayProducts(products);
    return;
  }

  const filtered = products.filter(product => product.category === category);
  displayProducts(filtered);
}

function getDisplayedProducts() {
  if (activeCategory === "all") return products;
  return products.filter(product => product.category === activeCategory);
}

function changeColor(index) {
  const displayedProducts = getDisplayedProducts();
  const product = displayedProducts[index];
  const selectedColor = document.getElementById(`color-${index}`).value;
  const image = document.getElementById(`img-${index}`);

  if (product && image) {
    image.src = product.images[selectedColor];
  }
}

function addToCart(index) {
  const displayedProducts = getDisplayedProducts();
  const product = displayedProducts[index];
  if (!product) return;

  const size = document.getElementById(`size-${index}`).value;
  const color = document.getElementById(`color-${index}`).value;

  cart.push({
    name: product.name,
    price: product.price,
    size: size,
    color: formatColorName(color)
  });

  updateCart();
  openCart();
}

function updateCart() {
  const items = document.getElementById("cart-items");
  items.innerHTML = "";

  let total = 0;

  if (cart.length === 0) {
    items.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
  } else {
    cart.forEach(item => {
      items.innerHTML += `
        <div class="cart-item">
          <div>
            <h5>${item.name}</h5>
            <p>Size: ${item.size}</p>
            <p>Color: ${item.color}</p>
          </div>
          <strong>$${item.price.toFixed(2)}</strong>
        </div>
      `;
      total += item.price;
    });
  }

  document.getElementById("cart-count").innerText = cart.length;
  document.getElementById("cart-total").innerText = "$" + total.toFixed(2);
}

function openCart() {
  document.getElementById("cart-panel").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}

function closeCart() {
  document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

document.querySelectorAll(".filters button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
  });
});

displayProducts(products);
document.querySelector(".filters button").classList.add("active");
updateCart();
