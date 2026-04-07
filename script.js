let products = [
{
name: "Lunar Oversized Hoodie",
price: 850,
image: "images/hoodie1.png",
category: "hoodie"
},
{
name: "Cosmic Butterfly Tee",
price: 450,
image: "images/shirt1.png",
category: "shirt"
},
{
name: "Trippy Pants",
price: 650,
image: "images/pants1.png",
category: "pants"
}
];

let cart = [];
let favorites = [];
let discount = 0;

/* LOAD PRODUCTS */
function displayProducts(list){
let container = document.querySelector(".products");
container.innerHTML = "";

list.forEach((p,i)=>{
container.innerHTML += `
<div class="product">

<div class="favorite ${favorites.includes(i) ? "active" : ""}" onclick="toggleFavorite(${i})">
🦋
</div>

<img src="${p.image}">
<h3>${p.name}</h3>
<p class="price">R${p.price}</p>

<button onclick="addToCart(${i})">Add to Cart</button>

</div>
`;
});
}

/* FILTER */
function filterProducts(category){
if(category === "all"){
displayProducts(products);
}else{
displayProducts(products.filter(p=>p.category===category));
}
}

/* CART */
function addToCart(index){
cart.push(products[index]);
updateCart();
}

function updateCart(){
document.getElementById("cart-count").innerText = cart.length;

let itemsHTML = "";
let total = 0;

cart.forEach(item=>{
total += item.price;
itemsHTML += `<p>${item.name} - R${item.price}</p>`;
});

total = total - (total * discount);

document.getElementById("cart-items").innerHTML = itemsHTML;
document.getElementById("cart-total").innerText = total.toFixed(0);
}

/* CART PANEL */
function toggleCart(){
document.getElementById("cart-panel").classList.toggle("open");
}

/* FAVORITES */
function toggleFavorite(index){
if(favorites.includes(index)){
favorites = favorites.filter(i=>i!==index);
}else{
favorites.push(index);
}
displayProducts(products);
}

/* PROMO */
function applyPromo(){
let code = document.getElementById("promo-input").value;

if(code === "LUNARA15"){
discount = 0.15;
document.getElementById("discount-msg").innerText = "15% applied";
}else{
discount = 0;
document.getElementById("discount-msg").innerText = "Invalid code";
}

updateCart();
}

/* INIT */
displayProducts(products);
