/* ============================================
   URBAN CART - MAIN JS
   Navbar, search, cart, UI interactions
   ============================================ */

/* ===== CART FUNCTIONS ===== */
const CART_KEY = 'urbancart_cart';

function getCart() {
  try {
    var data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCounter();
}

function addToCart(product, quantity) {
  quantity = quantity || 1;
  var cart = getCart();
  var existing = cart.find(function (item) {
    return item.id === product.id;
  });
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      fallbackImage: typeof getProductFallback === 'function' ? getProductFallback(product) : '',
      quantity: quantity
    });
  }
  saveCart(cart);
  showToast('Added to cart', 'success');
}

function updateCartCounter() {
  var cart = getCart();
  var count = cart.reduce(function (total, item) {
    return total + item.quantity;
  }, 0);
  var counters = document.querySelectorAll('.cart-badge');
  counters.forEach(function (counter) {
    counter.textContent = count;
    if (count > 0) {
      counter.style.display = 'flex';
    } else {
      counter.style.display = 'none';
    }
  });
}

/* ===== TOAST NOTIFICATIONS ===== */
function showToast(message, type) {
  type = type || 'info';
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  var icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0018 0z"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.999 3.378 2.5 2.5l11.5-6.643c.928-.536.928-1.879 0-2.415l-11.5-6.643c-1.501-.878-3.366.999-2.5 2.5l5.277 9.143"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>'
  };

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<div class="toast-icon">' + (icons[type] || icons.info) + '</div>' +
    '<div class="toast-message">' + message + '</div>' +
    '<button class="toast-close" aria-label="Close">' +
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
    '</button>';

  container.appendChild(toast);

  /* Close button */
  toast.querySelector('.toast-close').addEventListener('click', function () {
    removeToast(toast);
  });

  /* Auto-remove after 3 seconds */
  setTimeout(function () {
    removeToast(toast);
  }, 3000);
}

function removeToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.add('removing');
  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/* ===== STAR RATING HELPER ===== */
function generateStars(rating, size) {
  size = size || 16;
  var fullStars = Math.floor(rating);
  var hasHalf = rating % 1 >= 0.5;
  var html = '';
  for (var i = 0; i < 5; i++) {
    var cls = '';
    if (i < fullStars) {
      cls = '';
    } else if (i === fullStars && hasHalf) {
      cls = 'half';
    } else {
      cls = 'empty';
    }
    if (cls === 'half') {
      html += '<svg class="half" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '"><defs><linearGradient id="half-' + i + '-' + rating + '"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#D1D5DB"/></linearGradient></defs><path fill="url(#half-' + i + '-' + rating + ')" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.482 20.34a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>';
    } else {
      html += '<svg class="' + cls + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.482 20.34a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>';
    }
  }
  return html;
}

/* ===== PRODUCT CARD GENERATOR ===== */
function generateProductCard(product) {
  var inWish = typeof isInWishlist === 'function' && isInWishlist(product.id);
  var badgeClass = product.badge === 'New' ? 'new' : '';
  return '<article class="product-card" data-product-id="' + product.id + '">' +
    '<div class="product-card-image">' +
    '<span class="product-card-badge ' + badgeClass + '">' + product.badge + '</span>' +
    '<button class="product-card-wishlist ' + (inWish ? 'active' : '') + '" data-product-id="' + product.id + '" aria-label="Add to wishlist">' +
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>' +
    '</button>' +
    '<a href="product-details.html?id=' + product.id + '">' +
    '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + (typeof getProductFallback === 'function' ? getProductFallback(product) : '') + '\'">' +
    '</a>' +
    '</div>' +
    '<div class="product-card-body">' +
    '<span class="product-card-category">' + product.category + '</span>' +
    '<h3 class="product-card-name"><a href="product-details.html?id=' + product.id + '">' + product.name + '</a></h3>' +
    '<p class="product-card-desc">' + product.description + '</p>' +
    '<div class="product-card-rating">' +
    '<div class="product-card-stars">' + generateStars(product.rating, 16) + '</div>' +
    '<span class="product-card-review-count">(' + product.reviews + ')</span>' +
    '</div>' +
    '<div class="product-card-price">' +
    '<span class="product-card-current-price">EGB ' + product.price.toFixed(2) + '</span>' +
    '<span class="product-card-old-price">EGB ' + product.oldPrice.toFixed(2) + '</span>' +
    '</div>' +
    '<div class="product-card-actions">' +
    '<button class="btn btn-primary add-to-cart-btn" data-product-id="' + product.id + '">Add to Cart</button>' +
    '<a class="btn btn-secondary product-card-view-btn" href="product-details.html?id=' + product.id + '" aria-label="View details">' +
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' +
    '</a>' +
    '</div>' +
    '</div>' +
    '</article>';
}

/* ===== RENDER FEATURED PRODUCTS ===== */
function renderFeaturedProducts() {
  var container = document.getElementById('featured-products');
  if (!container) return;
  var featured = PRODUCTS.filter(function (p) {
    return !p.isNew;
  }).slice(0, 12);
  container.innerHTML = featured.map(generateProductCard).join('');
}

/* ===== RENDER NEW ARRIVALS ===== */
function renderNewArrivals() {
  var container = document.getElementById('new-arrivals');
  if (!container) return;
  var newArrivals = PRODUCTS.filter(function (p) {
    return p.isNew;
  }).slice(0, 8);
  container.innerHTML = newArrivals.map(generateProductCard).join('');
}

/* ===== RENDER CATEGORIES ===== */
function renderCategories() {
  var container = document.getElementById('categories-grid');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(function (cat) {
    var count = PRODUCTS.filter(function (p) { return p.category === cat.name; }).length;
    return '<a href="shop.html?category=' + encodeURIComponent(cat.name) + '" class="category-card" data-category="' + cat.name + '">' +
      '<img src="' + cat.image + '" alt="' + cat.name + '" loading="lazy">' +
      '<div class="category-card-overlay">' +
      '<h3 class="category-card-name">' + cat.name + '</h3>' +
      '<p class="category-card-desc">' + cat.description + ' · ' + count + ' products</p>' +
      '</div>' +
      '<div class="category-card-arrow">' +
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>' +
      '</div>' +
      '</a>';
  }).join('');
}

/* ===== ATTACH EVENT DELEGATION FOR PRODUCT CARDS ===== */
function attachProductCardEvents() {
  document.addEventListener('click', function (e) {
    /* Wishlist button */
    var wishBtn = e.target.closest('.product-card-wishlist');
    if (wishBtn) {
      e.preventDefault();
      e.stopPropagation();
      var productId = parseInt(wishBtn.getAttribute('data-product-id'), 10);
      var product = PRODUCTS.find(function (p) {
        return p.id === productId;
      });
      if (product) {
        var added = toggleWishlist(product);
        if (added) {
          wishBtn.classList.add('active');
        } else {
          wishBtn.classList.remove('active');
        }
      }
      return;
    }
    /* Add to cart button */
    var cartBtn = e.target.closest('.add-to-cart-btn');
    if (cartBtn) {
      e.preventDefault();
      var pid = parseInt(cartBtn.getAttribute('data-product-id'), 10);
      var prod = PRODUCTS.find(function (p) {
        return p.id === pid;
      });
      if (prod) {
        addToCart(prod);
      }
      return;
    }
  });
}

/* ===== NAVBAR FUNCTIONALITY ===== */
function initNavbar() {
  var hamburger = document.querySelector('.navbar-hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');
  var overlay = document.querySelector('.mobile-overlay');

  if (hamburger && mobileMenu) {
    hamburger.dataset.mainBound = '1';
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      if (overlay) {
        overlay.classList.toggle('show');
      }
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function () {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    });
  }

  /* Close mobile menu when clicking a link */
  if (mobileMenu) {
    var links = mobileMenu.querySelectorAll('a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
        if (overlay) {
          overlay.classList.remove('show');
        }
        document.body.style.overflow = '';
      });
    });
  }

  /* Navbar shadow on scroll */
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
}

/* ===== SMOOTH SCROLLING ===== */
function initSmoothScroll() {
  var links = document.querySelectorAll('a[href^="#"]');
  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#' || href === '#/') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  var elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(function (el) {
    observer.observe(el);
  });
}

/* ===== NEWSLETTER FORM ===== */
function initNewsletter() {
  var form = document.querySelector('.newsletter-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var input = form.querySelector('input');
    if (input && input.value.trim()) {
      showToast('Subscribed successfully!', 'success');
      input.value = '';
    } else {
      showToast('Please enter your email', 'error');
    }
  });
}

/* ===== INIT ON DOM READY ===== */
document.addEventListener('DOMContentLoaded', function () {
  initNavbar();
  initSmoothScroll();
  renderCategories();
  renderFeaturedProducts();
  renderNewArrivals();
  attachProductCardEvents();
  updateCartCounter();
  updateWishlistCounter();
  initScrollReveal();
  initNewsletter();
});

/* Expose globally */
if (typeof window !== 'undefined') {
  window.addToCart = addToCart;
  window.getCart = getCart;
  window.updateCartCounter = updateCartCounter;
  window.showToast = showToast;
  window.generateStars = generateStars;
  window.generateProductCard = generateProductCard;
}
