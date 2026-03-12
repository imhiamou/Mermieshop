const products = [
  {
    id: "rose-serum",
    name: "Rose Glow Serum",
    description: "Light hydration serum with a gentle floral scent.",
    category: "beauty",
    price: 18.0,
    icon: "🧴",
  },
  {
    id: "pink-candle",
    name: "Blush Dream Candle",
    description: "Soft vanilla and peony candle for cozy evenings.",
    category: "home",
    price: 14.5,
    icon: "🕯️",
  },
  {
    id: "berry-notebook",
    name: "Berry Dot Notebook",
    description: "A5 dotted notebook with a smooth matte pink cover.",
    category: "stationery",
    price: 9.0,
    icon: "📓",
  },
  {
    id: "marshmallow-cookies",
    name: "Marshmallow Cookies",
    description: "Crunchy cookies with a sweet marshmallow center.",
    category: "snacks",
    price: 7.0,
    icon: "🍪",
  },
  {
    id: "silk-scrunchie",
    name: "Silk Pink Scrunchie",
    description: "Smooth, gentle scrunchie for everyday hairstyles.",
    category: "beauty",
    price: 6.5,
    icon: "🎀",
  },
  {
    id: "petal-mug",
    name: "Petal Ceramic Mug",
    description: "Cute blush mug, perfect for tea or hot chocolate.",
    category: "home",
    price: 12.0,
    icon: "☕",
  },
  {
    id: "sticker-pack",
    name: "Floral Sticker Pack",
    description: "30 pastel floral stickers for journals and planners.",
    category: "stationery",
    price: 5.0,
    icon: "🌷",
  },
  {
    id: "strawberry-bites",
    name: "Strawberry Bites",
    description: "Freeze-dried strawberry snack with no added sugar.",
    category: "snacks",
    price: 8.5,
    icon: "🍓",
  },
];

const CART_STORAGE_KEY = "pink-petals-cart";
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const state = {
  query: "",
  category: "all",
  cart: loadCart(),
};

const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("category-select");
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
  renderProducts();
  renderCart();

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  categorySelect.addEventListener("change", (event) => {
    state.category = event.target.value;
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
    productGrid.innerHTML = '<p class="empty-note">No products found.</p>';
    return;
  }

  for (const product of filtered) {
    const node = productTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".product-icon").textContent = product.icon;
    node.querySelector("h3").textContent = product.name;
    node.querySelector(".product-description").textContent = product.description;
    node.querySelector(".price").textContent = currency.format(product.price);
    node.querySelector("button").addEventListener("click", () => addToCart(product.id));
    productGrid.append(node);
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
      node.querySelector(".cart-item-price").textContent = `${currency.format(
        product.price
      )} each`;
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
  subtotalValue.textContent = currency.format(subtotal);
  shippingValue.textContent = shipping === 0 ? "Free" : currency.format(shipping);
  totalValue.textContent = currency.format(subtotal + shipping);
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
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function persistCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
}
