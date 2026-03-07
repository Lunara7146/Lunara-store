let cartCount = 0;

const sizes = ["XS","S","M","L","XL"];

const products = [

{
name:"Lunar Oversized Hoodie",
price:"$39.99",
image:"lunar-hoodie.png",
category:"hoodie"
},

{
name:"Galaxy Flow Hoodie",
price:"$39.95",
image:"galaxy-flow-hoodie.png",
category:"hoodie"
},

{
name:"Cosmic Butterfly Tee",
price:"$24.99",
image:"cosmic-butterfly-tee.png",
category:"shirt"
},

{
name:"Psychedelic Mushroom Tee",
price:"$24.85",
image:"psychedelic-mushroom-tee.png",
category:"shirt"
},

{
name:"Trippy Festival Pants",
price:"$29.95",
image:"trippy-festival-pants.png",
category:"pants"
},

{
name:"Moon Phase Hippie Pants",
price:"$29.85",
image:"moon-phase-hippie-pants.png",
category:"pants"
}

];

const productsContainer = document.querySelector(".products");

products.forEach((product,index)=>{

const div = document.createElement("div");
div.className="product";

let logoPosition="bottom:10px; right:10px;";

if(product.category==="pants"){
logoPosition="top:10px; right:10px;";
}

div.innerHTML=`

<img src="${product.image}" alt="${product.name}">

<img src="logo-small.png" style="position:absolute;width:40px;height:40px;${logoPosition}">

<h3>${product.name}</h3>

<p>${product.price}</p>

<select id="size-${index}">
${sizes.map(size=>`<option value="${size}">${size}</option>`).join("")}
</select>

<br><br>

<button onclick="addToCart(${index})">Add To Cart</button>

`;

productsContainer.appendChild(div);

});

function addToCart(index){

const size=document.getElementById(`size-${index}`).value;

cartCount++;

document.getElementById("cart-count").innerText=cartCount;

alert("Added to cart: "+products[index].name+" Size: "+size);

}
