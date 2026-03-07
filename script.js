
let cart = [];

const sizes = ["XS","S","M","L","XL"];
const colors = ["Black","White","Purple","Blue"];

const products = [

{
name:"Lunar Oversized Hoodie",
price:39.99,
image:"lunar-hoodie.png",
category:"hoodie"
},

{
name:"Galaxy Flow Hoodie",
price:39.95,
image:"galaxy-flow-hoodie.png",
category:"hoodie"
},

{
name:"Cosmic Butterfly Tee",
price:24.99,
image:"cosmic-butterfly-tee.png",
category:"shirt"
},

{
name:"Psychedelic Mushroom Tee",
price:24.85,
image:"psychedelic-mushroom-tee.png",
category:"shirt"
},

{
name:"Trippy Festival Pants",
price:29.95,
image:"trippy-festival-pants.png",
category:"pants"
},

{
name:"Moon Phase Hippie Pants",
price:29.85,
image:"moon-phase-hippie-pants.png",
category:"pants"
}

];

const productsContainer=document.querySelector(".products");

products.forEach((product,index)=>{

let logoPosition="bottom:10px; right:10px;";
if(product.category==="pants"){logoPosition="top:10px; right:10px;"}

const div=document.createElement("div");
div.className="product";

div.innerHTML=`

<img src="${product.image}">

<img src="logo-small.png" style="position:absolute;width:40px;height:40px;${logoPosition}">

<h3>${product.name}</h3>

<p>$${product.price}</p>

<select id="size-${index}">
${sizes.map(size=>`<option>${size}</option>`).join("")}
</select>

<select id="color-${index}">
${colors.map(color=>`<option>${color}</option>`).join("")}
</select>

<br><br>

<button onclick="addToCart(${index})">Add To Cart</button>

`;

productsContainer.appendChild(div);

});

function addToCart(index){

const size=document.getElementById(`size-${index}`).value;
const color=document.getElementById(`color-${index}`).value;

cart.push({
name:products[index].name,
price:products[index].price,
size:size,
color:color
});

updateCart();
openCart();

}

function updateCart(){

const cartItems=document.getElementById("cart-items");
const cartCount=document.getElementById("cart-count");

cartItems.innerHTML="";
let total=0;

cart.forEach(item=>{

cartItems.innerHTML+=`
<div class="cart-item">
${item.name}<br>
Size: ${item.size} | Color: ${item.color}<br>
$${item.price}
</div>
`;

total+=item.price;

});

cartCount.innerText=cart.length;
document.getElementById("cart-total").innerText="$"+total.toFixed(2);

}

function openCart(){
document.getElementById("cart-panel").style.right="0";
}

function closeCart(){
document.getElementById("cart-panel").style.right="-400px";
}
