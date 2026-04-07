/**
 * LUNARA - Official Store Script
 */

document.addEventListener("DOMContentLoaded", () => {
    const butterfly = document.getElementById('butterfly');
    const introScreen = document.getElementById('intro-screen');
    const mainContent = document.getElementById('main-content');
    const introSeen = sessionStorage.getItem('lunara_butterfly_landed');

    if (!introSeen) {
        // First visit: Show animation
        mainContent.style.opacity = "0";
        butterfly.classList.add('fluttering');

        setTimeout(() => {
            // Fade out intro
            introScreen.style.opacity = '0';
            mainContent.style.opacity = '1';
            
            setTimeout(() => {
                introScreen.style.display = 'none';
                sessionStorage.setItem('lunara_butterfly_landed', 'true');
            }, 1500);
        }, 5000);
    } else {
        // Returning visit: Skip intro
        introScreen.style.display = 'none';
        mainContent.style.opacity = '1';
    }

    loadProducts();
});

// 🛍️ STORE STATE
let cart = JSON.parse(localStorage.getItem("lunaraCart")) || [];
let activeCategory = "all";
let storeProducts = [];
let appliedDiscountRate = Number(localStorage.getItem("lunaraDiscountRate")) || 0;
let appliedPromoCode = localStorage.getItem("lunaraPromoCode") || "";

const fallbackSizes = ["XS", "S", "M", "L", "XL"];

// LOCAL CATALOG
const localCatalog = [
    { id: "lunar-hoodie", name: "Moon Phase Hoodie", category: "hoodie", price: 1100, images: { black: "images/hoodies/lunar-hoodie-black.png" } },
    { id: "butterfly-tee", name: "Butterfly Tee", category: "shirt", price: 450, images: { black: "images/shirts/butterfly-tee-black.png" } },
    { id: "moon-pants", name: "Moon Phase Pants", category: "pants", price: 850, images: { black: "images/pants/moon-pants-black.png" } }
];

// 🛠️ FUNCTIONS
async function loadProducts() {
    // Attempt Printify API first, otherwise use localCatalog
    try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error();
        const data = await response.json();
        storeProducts = data.data.map(p => ({
            id: p.id,
            name: p.title,
            category: p.title.toLowerCase().includes("hoodie") ? "hoodie" : "shirt",
            price: p.variants[0].price / 100,
            sizes: fallbackSizes,
            images: { black: p.images[0].src }
        }));
    } catch (e) {
        storeProducts = localCatalog;
    }
    displayProducts(storeProducts);
    updateCart();
}

function displayProducts(list) {
    const container = document.querySelector(".products");
    if (!container) return;

    const filtered = activeCategory === "all" ? list : list.filter(p => p.category === activeCategory);
    
    container.innerHTML = filtered.map((p, i) => `
        <div class="product-card">
            <div class="product-image-wrap">
                <img src="${p.images.black}" alt="${p.name}" class="product-image">
            </div>
            <div class="product-info">
                <p class="product-type">${p.category}</p>
                <h4>${p.name}</h4>
                <p class="product-price">R${p.price.toFixed(2)}</p>
                <div class="product-options">
                    <select id="size-${i}">${p.sizes.map(s => `<option>${s}</option>`).join("")}</select>
                </div>
                <button onclick="addToCart(${i})">Add to Cart</button>
            </div>
        </div>
    `).join("");
}

window.filterProducts = (cat) => {
    activeCategory = cat;
    displayProducts(storeProducts);
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase() === cat || (cat === 'all' && btn.innerText === 'All'));
    });
};

window.addToCart = (index) => {
    const p = storeProducts[index];
    const size = document.getElementById(`size-${index}`).value;
    cart.push({ ...p, size, quantity: 1 });
    updateCart();
    openCart();
};

window.updateCart = () => {
    const itemsDiv = document.getElementById("cart-items");
    itemsDiv.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div><h5>${item.name}</h5><p>${item.size}</p></div>
            <button onclick="removeFromCart(${i})">Remove</button>
        </div>
    `).join("") || '<p class="empty-cart">Empty</p>';

    const subtotal = cart.reduce((s, i) => s + i.price, 0);
    document.getElementById("cart-count").innerText = cart.length;
    document.getElementById("cart-subtotal").innerText = `R${subtotal.toFixed(2)}`;
    document.getElementById("cart-total").innerText = `R${(subtotal * (1 - appliedDiscountRate)).toFixed(2)}`;
    localStorage.setItem("lunaraCart", JSON.stringify(cart));
};

window.removeFromCart = (i) => { cart.splice(i, 1); updateCart(); };
window.openCart = () => { document.getElementById("cart-panel").classList.add("open"); document.getElementById("overlay").classList.add("show"); };
window.closeCart = () => { document.getElementById("cart-panel").classList.remove("open"); document.getElementById("overlay").classList.remove("show"); };

window.applyPromoCode = () => {
    const code = document.getElementById("promo-code").value.toUpperCase();
    if (code === "LUNARA15") {
        appliedDiscountRate = 0.15;
        document.getElementById("promo-message").innerText = "15% Discount Applied!";
        updateCart();
    }
};

window.preparePayFastCheckout = () => {
    const subtotal = cart.reduce((s, i) => s + i.price, 0);
    document.getElementById("pf-amount").value = (subtotal * (1 - appliedDiscountRate)).toFixed(2);
    document.getElementById("pf-item-name").value = cart.map(i => i.name).join(", ");
    document.getElementById("pf-name-first").value = document.getElementById("customer-first-name").value;
    document.getElementById("pf-email-address").value = document.getElementById("customer-email").value;
    document.getElementById("pf-payment-id").value = "LUNARA-" + Date.now();
    return true;
};
