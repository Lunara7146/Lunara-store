let cart = [];

const sizes = ["XS","S","M","L","XL"];
const colors = ["Black","White","Purple","Blue"];

// =========================
// PRODUCTS
// =========================
const products = [
  {name:"Lunar Oversized Hoodie", price:39.99, image:"images/lunar-hoodie.png", category:"hoodie"},
  {name:"Galaxy Flow Hoodie", price:39.95, image:"images/galaxy-flow-hoodie.png", category:"hoodie"},
  {name:"Cosmic Butterfly Tee", price:24.99, image:"images/cosmic-butterfly-tee.png", category:"shirt"},
  {name:"Psychedelic Mushroom Tee", price:24.85, image:"images/psychedelic-mushroom-tee.png", category:"shirt"},
  {name:"Trippy Festival Pants", price:29.95, image:"images/trippy-festival-pants.png", category:"pants"},
  {name:"Moon Phase Hippie Pants", price:29.85, image:"images/moon-phase-hippie-pants.png", category:"pants"}
];

const container = document.querySelector(".products");

// =========================
// DISPLAY PRODUCTS
// =========================
function displayProducts(list){
  container.innerHTML = "";
  list.forEach((product,index)=>{
    let logoPosition = product.category==="pants" ? "top:10px; right:10px;" : "bottom:10px; right:10px;";
    const div = document.createElement("div");
    div.className="product";
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <img src="images/logo-small.png" style="position:absolute;width:40px;height:40px;${logoPosition}">
      <h3>${product.name}</h3>
      <p>$${product.price}</p>
      <select id="size-${index}">
        ${sizes.map(s=>`<option>${s}</option>`).join("")}
      </select>
      <select id="color-${index}">
        ${colors.map(c=>`<option>${c}</option>`).join("")}
      </select>
      <br><br>
      <button onclick="addToCart(${index})">Add To Cart</button>
    `;
    container.appendChild(div);
  });
}

// Initial display
displayProducts(products);

// =========================
// CATEGORY FILTER
// =========================
function filterProducts(category){
  if(category==="all"){ displayProducts(products); return; }
  const filtered = products.filter(p => p.category===category);
  displayProducts(filtered);
}

// =========================
// CART LOGIC
// =========================
function addToCart(index){
  const size = document.getElementById(`size-${index}`).value;
  const color = document.getElementById(`color-${index}`).value;
  cart.push({
    name: products[index].name,
    price: products[index].price,
    size: size,
    color: color
  });
  updateCart();
  openCart();
}

function updateCart(){
  const items = document.getElementById("cart-items");
  items.innerHTML="";
  let total = 0;
  cart.forEach(item=>{
    items.innerHTML+=`
      <div class="cart-item">
        ${item.name}<br>
        Size: ${item.size} | Color: ${item.color}<br>
        $${item.price}
      </div>
    `;
    total += item.price;
  });

  document.getElementById("cart-count").innerText = cart.length;
  document.getElementById("cart-total").innerText = "$"+total.toFixed(2);
}

// Open / close cart
function openCart(){ document.getElementById("cart-panel").style.right="0"; }
function closeCart(){ document.getElementById("cart-panel").style.right="-400px"; }

// =========================
// TAP BUTTERFLY EFFECT
// =========================
document.addEventListener("click", function(e){
  const butterfly = document.createElement("img");
  
  // Randomly pick blue or purple butterfly
  const color = Math.random() < 0.5 ? "blue" : "purple";
  butterfly.src = `images/butterfly-${color}.png`;
  
  butterfly.style.position = "absolute";
  butterfly.style.width = "50px";
  butterfly.style.height = "50px";
  butterfly.style.left = `${e.pageX - 25}px`;
  butterfly.style.top = `${e.pageY - 25}px`;
  butterfly.style.pointerEvents = "none";
  butterfly.style.transition = "all 1s ease-out";
  butterfly.style.opacity = "1";
  butterfly.style.transform = "scale(0) rotate(0deg)";
  
  document.body.appendChild(butterfly);
  
  // Animate butterfly
  requestAnimationFrame(() => {
    butterfly.style.transform = `scale(1) rotate(${Math.random()*360}deg)`;
    butterfly.style.top = `${e.pageY - 75}px`; // float upward
    butterfly.style.opacity = "0";
  });
  
  // Remove after animation
  setTimeout(() => {
    butterfly.remove();
  }, 1000);
});
