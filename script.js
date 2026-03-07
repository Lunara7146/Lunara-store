
const products = [
  { 
    name: "Lunar Oversized Hoodie", 
    priceUSD: 39.99, 
    priceZAR: 759, 
    category: "Hoodie", 
    image: "https://github.com/Lunara7146/lunara-store/blob/main/lunar-hoodie.png?raw=true" 
  },
  { 
    name: "Galaxy Flow Hoodie", 
    priceUSD: 39.95, 
    priceZAR: 758, 
    category: "Hoodie", 
    image: "https://github.com/Lunara7146/lunara-store/blob/main/galaxy-flow-hoodie.png?raw=true" 
  },
  { 
    name: "Cosmic Butterfly Tee", 
    priceUSD: 24.99, 
    priceZAR: 474, 
    category: "T-Shirt", 
    image: "https://github.com/Lunara7146/lunara-store/blob/main/cosmic-butterfly-tee.png?raw=true" 
  },
  { 
    name: "Psychedelic Mushroom Tee", 
    priceUSD: 24.85, 
    priceZAR: 475, 
    category: "T-Shirt", 
    image: "https://github.com/Lunara7146/lunara-store/blob/main/psychedelic-mushroom-tee.png?raw=true" 
  },
  { 
    name: "Trippy Festival Pants", 
    priceUSD: 29.95, 
    priceZAR: 569, 
    category: "Pants", 
    image: "https://github.com/Lunara7146/lunara-store/blob/main/trippy-festival-pants.png?raw=true" 
  },
  { 
    name: "Moon Phase Hippie Pants", 
    priceUSD: 29.85, 
    priceZAR: 571, 
    category: "Pants", 
    image: "https://github.com/Lunara7146/lunara-store/blob/main/moon-phase-hippie-pants.png?raw=true" 
  }
];

const productsContainer = document.querySelector(".products");

products.forEach(product => {
  const div = document.createElement("div");
  div.className = "product";
  div.style.position = "relative"; // needed for absolute logo positioning

  // Determine logo placement
  let logoPositionStyle = "";
  if(product.category === "Hoodie" || product.category === "T-Shirt"){
    logoPositionStyle = "position:absolute; bottom:10px; right:10px; width:40px; height:40px;";
  } else if(product.category === "Pants"){
    logoPositionStyle = "position:absolute; top:10px; right:10px; width:40px; height:40px;";
  }

  div.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <img src="logo-small.png" alt="Logo" style="${logoPositionStyle}">
    <h3>${product.name}</h3>
    <p>$${product.priceUSD.toFixed(2)} | R${product.priceZAR}</p>
    <button>Add to Cart</button>
  `;
  productsContainer.appendChild(div);
});
