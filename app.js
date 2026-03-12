const products = [];

const categories = [
  { id: "all", label: "All", icon: "🫧" },
  { id: "jewelry", label: "Jewelry", icon: "💍" },
  { id: "books", label: "Books", icon: "📚" },
  { id: "toys", label: "Toys", icon: "🧸" },
  { id: "kitchen", label: "Kitchen", icon: "🍳" },
  { id: "clothes", label: "Clothes", icon: "👗" },
  { id: "accessories", label: "Accessories", icon: "👜" },
];

const CART_STORAGE_KEY = "mermy-shop-cart";

const state = {
  query: "",
  category: "all",
  cart: loadCart(),
};

const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("search-input");
const categoryBubbles = document.getElementById("category-bubbles");
const cartCount = document.getElementById("cart-count");
const openCartBtn = document.getElementById("open-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartDrawer = document.getElementById("cart-drawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cart-items");
const subtotalValue = document.getElementById("subtotal-value");
const shippingValue = document.getElementById("shipping-value");
const totalValue = document.getElementById("total-value");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutDialog = document.getElementById("checkout-dialog");
const checkoutForm = document.getElementById("checkout-form");
const productTemplate = document.getElementById("product-card-template");
const cartItemTemplate = document.getElementById("cart-item-template");

init();

function init() {
  renderCategoryBubbles();
  renderProducts();
  renderCart();

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  openCartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  checkoutBtn.addEventListener("click", () => {
    if (getItemCount() === 0) {
      window.alert("Your cart is empty. Add something sweet first.");
      return;
    }
    checkoutDialog.showModal();
  });

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      return;
    }
    const name = new FormData(checkoutForm).get("name");
    window.alert(`Thanks ${name}! Your order is confirmed.`);
    state.cart = {};
    persistCart();
    checkoutForm.reset();
    checkoutDialog.close();
    closeCart();
    renderCart();
  });
}

function renderProducts() {
  productGrid.innerHTML = "";
  const filtered = products.filter((product) => {
    const categoryMatch =
      state.category === "all" || product.category === state.category;
    const queryMatch =
      state.query.length === 0 ||
      product.name.toLowerCase().includes(state.query) ||
      product.description.toLowerCase().includes(state.query);
    return categoryMatch && queryMatch;
  });

  if (filtered.length === 0) {
    productGrid.innerHTML =
      '<p class="empty-note">No items for sale right now. Check back soon.</p>';
    return;
  }

  for (const product of filtered) {
    const node = productTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".product-icon").textContent = product.icon;
    node.querySelector("h3").textContent = product.name;
    node.querySelector(".product-description").textContent = product.description;
    node.querySelector(".price").textContent = formatHearts(product.price);
    node.querySelector("button").addEventListener("click", () => addToCart(product.id));
    productGrid.append(node);
  }
}

function renderCategoryBubbles() {
  categoryBubbles.innerHTML = "";

  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bubble-chip";
    button.dataset.category = category.id;
    button.textContent = `${category.icon} ${category.label}`;
    if (state.category === category.id) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.category = category.id;
      renderCategoryBubbles();
      renderProducts();
    });

    categoryBubbles.append(button);
  }
}

function renderCart() {
  cartItems.innerHTML = "";
  const entries = Object.entries(state.cart).filter(([, qty]) => qty > 0);

  if (entries.length === 0) {
    cartItems.innerHTML = '<p class="empty-note">Your cart is empty.</p>';
  } else {
    for (const [id, qty] of entries) {
      const product = products.find((item) => item.id === id);
      if (!product) continue;

      const node = cartItemTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector("h4").textContent = product.name;
      node.querySelector(".cart-item-price").textContent = `${formatHearts(product.price)} each`;
      node.querySelector(".qty").textContent = String(qty);
      node
        .querySelector(".increase")
        .addEventListener("click", () => changeQuantity(product.id, 1));
      node
        .querySelector(".decrease")
        .addEventListener("click", () => changeQuantity(product.id, -1));
      node
        .querySelector(".remove")
        .addEventListener("click", () => removeItem(product.id));

      cartItems.append(node);
    }
  }

  const subtotal = calculateSubtotal();
  const shipping = subtotal === 0 ? 0 : subtotal >= 50 ? 0 : 4.99;
  subtotalValue.textContent = formatHearts(subtotal);
  shippingValue.textContent = shipping === 0 ? "Free" : formatHearts(shipping);
  totalValue.textContent = formatHearts(subtotal + shipping);
  cartCount.textContent = String(getItemCount());
}

function addToCart(productId) {
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  persistCart();
  renderCart();
  openCart();
}

function changeQuantity(productId, change) {
  const nextValue = (state.cart[productId] || 0) + change;
  if (nextValue <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = nextValue;
  }
  persistCart();
  renderCart();
}

function removeItem(productId) {
  delete state.cart[productId];
  persistCart();
  renderCart();
}

function calculateSubtotal() {
  return Object.entries(state.cart).reduce((total, [id, qty]) => {
    const product = products.find((item) => item.id === id);
    if (!product) return total;
    return total + product.price * qty;
  }, 0);
}

function getItemCount() {
  return Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
}

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || {};
    const allowedIds = new Set(products.map((product) => product.id));
    return Object.fromEntries(
      Object.entries(raw).filter(
        ([id, qty]) => allowedIds.has(id) && Number.isFinite(qty) && qty > 0
      )
    );
  } catch {
    return {};
  }
}

function persistCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
}

function formatHearts(value) {
  return `❤️${Number(value).toFixed(2)}`;
}
