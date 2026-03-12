const products = [
  {
    id: "haimatong-pt950-ring",
    name: "HAIMATONG PT950 Moissanite Ring",
    description:
      "Platinum-edged moissanite ring with low-key European/American style.",
    category: "jewelry",
    price: 38.92,
    icon: "💍",
    images: [
      "https://ae-pic-a1.aliexpress-media.com/kf/S12872310b1a84159af40657ec2faffecj.jpg_960x960q75.jpg",
      "https://ae-pic-a1.aliexpress-media.com/kf/S8d0e10104e3f4f24b4e5f4db1b78e02aY.jpg_220x220q75.jpg",
      "https://ae-pic-a1.aliexpress-media.com/kf/S0a38b884abb44b18b1cce56e7f9884d2k.jpg_220x220q75.jpg",
      "https://ae-pic-a1.aliexpress-media.com/kf/Sce4f185de9a8474f948a1a94161161f0R.jpg_220x220q75.jpg",
      "https://ae-pic-a1.aliexpress-media.com/kf/Sceb9a1fb5cc74438b9126882b50d2c16c.jpg_220x220q75.jpg",
      "https://ae-pic-a1.aliexpress-media.com/kf/Sc4bb9d4f12de4c5bafce9e28043a8664W.jpg_220x220q75.jpg",
    ],
    sourceUrl:
      "https://www.aliexpress.us/item/3256811621897780.html",
  },
];

const categories = [
  { id: "all", label: "All", icon: "🫧" },
  { id: "jewelry", label: "Jewelry", icon: "💍" },
  { id: "books", label: "Books", icon: "📚" },
  { id: "toys", label: "Toys", icon: "🧸" },
  { id: "kitchen", label: "Kitchen", icon: "🍳" },
  { id: "fashion", label: "Fashion", icon: "👠" },
  { id: "accessories", label: "Accessories", icon: "👜" },
];

const USERS_STORAGE_KEY = "mermy-shop-users";
const LEGACY_CART_STORAGE_KEY = "mermy-shop-cart";
const AUTH_USERNAME = "mermy";
const AUTH_PASSWORD = "wolf";

const state = {
  query: "",
  category: "all",
  cart: {},
  activeUser: null,
  selectedProductId: null,
};

const shopApp = document.getElementById("shop-app");
const shopHomeView = document.getElementById("shop-home-view");
const productDetailView = document.getElementById("product-detail-view");
const detailBackBtn = document.getElementById("detail-back-btn");
const detailImageScroll = document.getElementById("detail-image-scroll");
const detailDescription = document.getElementById("detail-description");
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

let shopInitialized = false;
boot();

function boot() {
  showLockedScreen();
  const username = requestAccess();
  if (username) {
    startUserSession(username);
    showShop();
    initShop();
  }
}

function startUserSession(username) {
  state.activeUser = username;
  const users = loadUsers();
  const profile = users[username] || { cart: {}, lastLoginAt: null };

  const legacyCart = loadLegacyCart();
  if (Object.keys(profile.cart || {}).length === 0 && Object.keys(legacyCart).length > 0) {
    profile.cart = legacyCart;
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  }

  profile.lastLoginAt = new Date().toISOString();
  state.cart = sanitizeCart(profile.cart);
  users[username] = profile;
  saveUsers(users);
}

function initShop() {
  if (shopInitialized) {
    return;
  }
  shopInitialized = true;

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
  detailBackBtn.addEventListener("click", closeProductDetail);

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
    const galleryEl = node.querySelector(".product-gallery");
    const imageScrollEl = node.querySelector(".product-image-scroll");
    const iconEl = node.querySelector(".product-icon");
    const imageList = getProductImages(product);
    const addToCartBtn = node.querySelector("button");

    if (imageList.length > 0) {
      renderImageGallery(imageScrollEl, imageList, product.name, "product-image-slide");
      galleryEl.hidden = false;
      iconEl.hidden = true;
    } else {
      iconEl.textContent = product.icon || "🛍️";
      iconEl.hidden = false;
      galleryEl.hidden = true;
    }
    node.querySelector("h3").textContent = product.name;
    node.querySelector(".product-description").textContent = product.description;
    node.querySelector(".price").textContent = formatHearts(product.price);
    node.setAttribute("role", "button");
    node.tabIndex = 0;
    node.addEventListener("click", () => openProductDetail(product.id));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProductDetail(product.id);
      }
    });
    addToCartBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      addToCart(product.id);
    });
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
      const previewBtn = node.querySelector(".cart-item-preview");
      const previewImage = node.querySelector(".cart-item-image");
      const previewFallback = node.querySelector(".cart-item-fallback");
      const images = getProductImages(product);

      if (images.length > 0) {
        setImageWithFallback(previewImage, images[0]);
        previewImage.alt = product.name;
        previewImage.hidden = false;
        previewFallback.hidden = true;
      } else {
        previewFallback.textContent = product.icon || "🛍️";
        previewFallback.hidden = false;
        previewImage.hidden = true;
      }

      previewBtn.addEventListener("click", () => openProductDetail(product.id));
      const titleEl = node.querySelector("h4");
      titleEl.textContent = product.name;
      titleEl.addEventListener("click", () => openProductDetail(product.id));
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
  const shipping = 0;
  subtotalValue.textContent = formatHearts(subtotal);
  shippingValue.textContent = "Free";
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
  return Object.entries(state.cart).reduce((sum, [id, qty]) => {
    const product = products.find((item) => item.id === id);
    if (!product) return sum;
    return sum + qty;
  }, 0);
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

function loadLegacyCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(LEGACY_CART_STORAGE_KEY)) || {};
    return sanitizeCart(raw);
  } catch {
    return {};
  }
}

function persistCart() {
  if (!state.activeUser) return;
  const users = loadUsers();
  const profile = users[state.activeUser] || { cart: {}, lastLoginAt: null };
  profile.cart = sanitizeCart(state.cart);
  users[state.activeUser] = profile;
  saveUsers(users);
}

function formatHearts(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "—";
  }
  const hearts = Math.max(1, Math.ceil(amount / 10));
  return "❤️".repeat(hearts);
}

function showShop() {
  document.body.classList.remove("auth-locked");
  document.title = "Mermy Shop";
  shopApp.hidden = false;
  closeProductDetail();
}

function showLockedScreen() {
  document.body.classList.add("auth-locked");
  document.title = "Loading";
  shopApp.hidden = true;
}

function requestAccess() {
  while (true) {
    const username = window.prompt("Username:");
    if (username === null) {
      return false;
    }

    const password = window.prompt("Password:");
    if (password === null) {
      return false;
    }

    if (username.trim() === AUTH_USERNAME && password === AUTH_PASSWORD) {
      return AUTH_USERNAME;
    }

    window.alert("Invalid username or password.");
  }
}

function loadUsers() {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || {};
    if (raw && typeof raw === "object") {
      return raw;
    }
    return {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function sanitizeCart(cartLike) {
  if (!cartLike || typeof cartLike !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(cartLike).filter(
      ([id, qty]) => typeof id === "string" && Number.isFinite(qty) && qty > 0
    )
  );
}

function openProductDetail(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const images = getProductImages(product);
  detailImageScroll.innerHTML = "";
  if (images.length > 0) {
    renderImageGallery(detailImageScroll, images, product.name, "detail-image-slide");
  } else {
    detailImageScroll.innerHTML = '<p class="empty-note">No images available.</p>';
  }

  detailDescription.textContent = product.description || "No description available.";
  state.selectedProductId = productId;
  shopHomeView.hidden = true;
  productDetailView.hidden = false;
  closeCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeProductDetail() {
  state.selectedProductId = null;
  productDetailView.hidden = true;
  shopHomeView.hidden = false;
}

function getProductById(productId) {
  return products.find((product) => product.id === productId);
}

function getProductImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }
  if (product.image) {
    return [product.image];
  }
  return [];
}

function renderImageGallery(container, imageList, altText, imageClass) {
  container.innerHTML = "";
  for (const imageUrl of imageList) {
    const img = document.createElement("img");
    img.className = imageClass;
    setImageWithFallback(img, imageUrl);
    img.alt = altText;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    container.append(img);
  }
}

function setImageWithFallback(imgElement, url) {
  const candidates = buildImageCandidates(url);
  let index = 0;

  const loadNext = () => {
    if (index >= candidates.length) {
      return;
    }
    imgElement.src = candidates[index];
    index += 1;
  };

  imgElement.addEventListener("error", loadNext);
  loadNext();
}

function buildImageCandidates(url) {
  const candidates = [
    url,
    url.replace("_.avif", "_.webp"),
    url.replace("_.avif", ""),
    url.replace(/\.jpg_\d+x\d+q\d+\.jpg(?:_.avif|_.webp)?$/, ".jpg"),
  ];
  return [...new Set(candidates)];
}
