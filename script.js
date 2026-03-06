    priceUSD: 29.85, 
    priceZAR: 571, 
    category: "Boho", 
    image: "https://github.com/<your-username>/lunara-store/blob/main/moon-phase-hippie-pants.png?raw=true" 
  }
];

// Select the container where products will appear
const productsContainer = document.querySelector(".products");

// Loop through products and dynamically add them to the store
products.forEach(product => {
  const div = document.createElement("div");
  div.className = "product";
  div.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <h3>${product.name}</h3>
    <p>$${product.priceUSD.toFixed(2)} | R${product.priceZAR}</p>
    <button>Add to Cart</button>
  `;
  productsContainer.appendChild(div);
});
