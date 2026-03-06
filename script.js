const products = [
  { name: "Lunar Oversized Hoodie", priceUSD: 65, priceZAR: 1200, category: "Streetwear", image: "https://via.placeholder.com/300x400?text=Lunar+Oversized+Hoodie" },
  { name: "Cosmic Butterfly Tee", priceUSD: 40, priceZAR: 750, category: "Streetwear", image: "https://via.placeholder.com/300x400?text=Cosmic+Butterfly+Tee" },
  { name: "Trippy Festival Pants", priceUSD: 55, priceZAR: 1000, category: "Festival", image: "https://via.placeholder.com/300x400?text=Trippy+Festival+Pants" },
  { name: "Moon Phase Hippie Pants", priceUSD: 60, priceZAR: 1100, category: "Boho", image: "https://via.placeholder.com/300x400?text=Moon+Phase+Hippie+Pants" },
  { name: "Galaxy Flow Hoodie", priceUSD: 70, priceZAR: 1300, category: "Trippy", image: "https://via.placeholder.com/300x400?text=Galaxy+Flow+Hoodie" },
  { name: "Psychedelic Mushroom Tee", priceUSD: 50, priceZAR: 950, category: "Trippy", image: "https://via.placeholder.com/300x400?text=Psychedelic+Mushroom+Tee" }
];

const productsContainer = document.querySelector(".products");

products.forEach(product => {
  const div = document.createElement("div");
  div.className = "product";
  div.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <h3>${product.name}</h3>
    <p>$${product.priceUSD} | R${product.priceZAR}</p>
    <button>Add to Cart</button>
  `;
  productsContainer.appendChild(div);
});
