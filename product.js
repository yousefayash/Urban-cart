/* ============================================
   URBAN CART - PRODUCT DETAILS MODULE
   Product details, gallery, reviews, related
   ============================================ */

/* ===== GET PRODUCT ID FROM URL ===== */
function getProductIdFromUrl() {
  var params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'), 10);
}

/* ===== GET THE CURRENT PRODUCT (null if the id is missing/invalid) ===== */
function getCurrentProduct() {
  var productId = getProductIdFromUrl();
  if (!productId) return null;
  return PRODUCTS.find(function (p) {
    return p.id === productId;
  }) || null;
}

/* ===== EMPTY STATE WHEN THE PRODUCT DOES NOT EXIST ===== */
function renderProductNotFound(container) {
  document.title = 'Product Not Found - Urban Cart';

  var breadcrumbName = document.getElementById('breadcrumb-product-name');
  if (breadcrumbName) breadcrumbName.textContent = 'Not Found';

  container.innerHTML =
    '<div class="product-not-found">' +
    '<h2>Product not found</h2>' +
    '<p>The product you are looking for does not exist or has been removed.</p>' +
    '<a href="index.html#products" class="btn btn-primary">Back to Products</a>' +
    '</div>';

  var tabs = document.getElementById('product-tabs-section');
  if (tabs) tabs.style.display = 'none';
  var reviews = document.getElementById('reviews');
  if (reviews) reviews.style.display = 'none';
}

/* ===== RENDER PRODUCT DETAILS ===== */
function renderProductDetails() {
  var container = document.getElementById('product-details-container');
  if (!container) return;

  var product = getCurrentProduct();
  if (!product) {
    renderProductNotFound(container);
    return;
  }

  /* Update breadcrumb */
  var breadcrumbName = document.getElementById('breadcrumb-product-name');
  if (breadcrumbName) breadcrumbName.textContent = product.name;

  /* Build gallery */
  var galleryHtml =
    '<div class="product-gallery">' +
    '<div class="product-main-image" id="main-image-container">' +
    '<img src="' + product.image + '" alt="' + product.name + '" id="main-product-image" onerror="this.onerror=null;this.src=\'' + (typeof getProductFallback === 'function' ? getProductFallback(product) : '') + '\'">' +
    '</div>' +
    '<div class="product-thumbnails">' +
    '<div class="product-thumbnail active" data-src="' + product.image + '">' +
    '<img src="' + product.image + '" alt="Thumbnail 1" onerror="this.onerror=null;this.src=\'' + (typeof getProductFallback === 'function' ? getProductFallback(product) : '') + '\'">' +
    '</div>' +
    '<div class="product-thumbnail" data-src="' + product.thumbnail2 + '">' +
    '<img src="' + product.thumbnail2 + '" alt="Thumbnail 2">' +
    '</div>' +
    '<div class="product-thumbnail" data-src="' + product.thumbnail3 + '">' +
    '<img src="' + product.thumbnail3 + '" alt="Thumbnail 3">' +
    '</div>' +
    '<div class="product-thumbnail" data-src="' + product.thumbnail4 + '">' +
    '<img src="' + product.thumbnail4 + '" alt="Thumbnail 4">' +
    '</div>' +
    '</div>' +
    '</div>';

  /* Build info */
  var inWish = typeof isInWishlist === 'function' && isInWishlist(product.id);
  var infoHtml =
    '<div class="product-info">' +
    '<span class="product-info-category">' + product.category + '</span>' +
    '<h1 class="product-info-name">' + product.name + '</h1>' +
    '<div class="product-info-rating">' +
    '<div class="product-info-stars">' + generateStars(product.rating, 20) + '</div>' +
    '<span class="product-info-review-text">' + product.rating.toFixed(1) + ' · <a href="#reviews">' + product.reviews + ' reviews</a></span>' +
    '</div>' +
    '<div class="product-info-price">' +
    '<span class="product-info-current-price">EGB ' + product.price.toFixed(2) + '</span>' +
    '<span class="product-info-old-price">EGB ' + product.oldPrice.toFixed(2) + '</span>' +
    '<span class="product-info-discount">-' + product.discount + '%</span>' +
    '</div>' +
    '<div class="product-info-stock">' +
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0018 0z"/></svg>' +
    '<span>' + product.stock + '</span>' +
    '</div>' +
    '<p class="product-info-description">' + product.description + ' Experience premium quality and exceptional craftsmanship designed to elevate your everyday lifestyle. This product comes with a manufacturer warranty and our satisfaction guarantee.</p>' +
    '<div class="product-quantity">' +
    '<label for="quantity-input">Quantity:</label>' +
    '<div class="quantity-selector">' +
    '<button class="quantity-btn" id="qty-decrease" type="button">−</button>' +
    '<input type="number" class="quantity-input" id="quantity-input" value="1" min="1" max="10">' +
    '<button class="quantity-btn" id="qty-increase" type="button">+</button>' +
    '</div>' +
    '</div>' +
    '<div class="product-actions">' +
    '<button class="btn btn-primary btn-lg" id="add-to-cart-detail">Add to Cart</button>' +
    '<button class="btn btn-secondary btn-lg" id="buy-now-detail">Buy Now</button>' +
    '<button class="btn product-action-wishlist ' + (inWish ? 'active' : '') + '" id="wishlist-toggle" data-product-id="' + product.id + '" aria-label="Add to wishlist">' +
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>' +
    '</button>' +
    '</div>' +
    '<div class="product-meta">' +
    '<div class="product-meta-item"><span class="product-meta-label">Brand</span><span class="product-meta-value">' + product.brand + '</span></div>' +
    '<div class="product-meta-item"><span class="product-meta-label">Category</span><span class="product-meta-value">' + product.category + '</span></div>' +
    '<div class="product-meta-item"><span class="product-meta-label">SKU</span><span class="product-meta-value">' + product.sku + '</span></div>' +
    '<div class="product-meta-item"><span class="product-meta-label">Shipping</span><span class="product-meta-value">Free Shipping</span></div>' +
    '</div>' +
    '</div>';

  container.innerHTML = galleryHtml + infoHtml;

  /* Store current product globally */
  window.currentProduct = product;

  /* Init gallery interactions */
  initGallery();
  /* Init quantity selector */
  initQuantitySelector();
  /* Init add to cart */
  initAddToCartDetail();
  /* Init wishlist toggle */
  initWishlistToggle();
  /* Init buy now */
  initBuyNow();
  /* Fill the tabs content with this product's data */
  fillProductTabs(product);
  /* Update document title */
  document.title = product.name + ' - Urban Cart';
}

/* ===== FILL TABS WITH PRODUCT DATA ===== */
function fillProductTabs(product) {
  var desc = document.getElementById('p-full-description');
  if (desc) desc.textContent = product.description + ' ' + (product.features || 'Designed for reliable everyday use with premium materials and a carefully finished user experience.');
  var specTable = document.querySelector('#tab-specs .specs-table');
  if (specTable) {
    var specs = product.specifications || {};
    specTable.innerHTML = Object.keys(specs).map(function(key){ return '<tr><th>' + key + '</th><td>' + specs[key] + '</td></tr>'; }).join('');
  }
  var shippingPane = document.querySelector('#tab-shipping p');
  var returnPane = document.querySelector('#tab-returns p');
  if (shippingPane) shippingPane.textContent = product.shipping || 'Fast delivery within 2-4 business days across Egypt.';
  if (returnPane) returnPane.textContent = product.returns || '14-day hassle-free returns in original condition.';
}

/* ===== TABS SWITCHING ===== */
function initProductTabs() {
  var buttons = document.querySelectorAll('.p-tab-btn');
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = this.getAttribute('data-tab');

      buttons.forEach(function (b) {
        b.classList.remove('active');
      });
      this.classList.add('active');

      document.querySelectorAll('.p-tab-pane').forEach(function (pane) {
        pane.classList.remove('active');
      });
      var pane = document.getElementById('tab-' + target);
      if (pane) pane.classList.add('active');
    });
  });
}

/* ===== GALLERY IMAGE SWITCHING ===== */
function initGallery() {
  var thumbnails = document.querySelectorAll('.product-thumbnail');
  var mainImage = document.getElementById('main-product-image');
  if (!mainImage) return;

  thumbnails.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var src = this.getAttribute('data-src');
      mainImage.style.opacity = '0';
      setTimeout(function () {
        mainImage.src = src;
        mainImage.style.opacity = '1';
      }, 200);
      thumbnails.forEach(function (t) {
        t.classList.remove('active');
      });
      this.classList.add('active');
    });
  });

  mainImage.style.transition = 'opacity 0.2s ease, transform 0.4s ease';
}

/* ===== QUANTITY SELECTOR ===== */
function initQuantitySelector() {
  var decrease = document.getElementById('qty-decrease');
  var increase = document.getElementById('qty-increase');
  var input = document.getElementById('quantity-input');
  if (!input) return;

  if (decrease) {
    decrease.addEventListener('click', function () {
      var val = parseInt(input.value, 10) || 1;
      if (val > 1) input.value = val - 1;
    });
  }
  if (increase) {
    increase.addEventListener('click', function () {
      var val = parseInt(input.value, 10) || 1;
      if (val < 10) input.value = val + 1;
    });
  }
  input.addEventListener('change', function () {
    var val = parseInt(this.value, 10) || 1;
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    this.value = val;
  });
}

/* ===== ADD TO CART ON DETAILS PAGE ===== */
function initAddToCartDetail() {
  var btn = document.getElementById('add-to-cart-detail');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var qty = parseInt(document.getElementById('quantity-input').value, 10) || 1;
    if (window.currentProduct) {
      addToCart(window.currentProduct, qty);
    }
  });
}

/* ===== WISHLIST TOGGLE ON DETAILS PAGE ===== */
function initBuyNow() {
  var btn = document.getElementById('buy-now-detail');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (!window.currentProduct) return;
    var qty = parseInt(document.getElementById('quantity-input').value, 10) || 1;
    addToCart(window.currentProduct, qty);
    location.href = 'checkout.html';
  });
}

function initWishlistToggle() {
  var btn = document.getElementById('wishlist-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (!window.currentProduct) return;
    var added = toggleWishlist(window.currentProduct);
    if (added) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/* ===== RENDER RELATED PRODUCTS ===== */
function renderRelatedProducts() {
  var container = document.getElementById('related-products');
  if (!container) return;

  var currentProduct = getCurrentProduct() || PRODUCTS[0];

  var related = PRODUCTS.filter(function (p) {
    return p.id !== currentProduct.id && p.category === currentProduct.category;
  }).slice(0, 4);

  if (related.length < 4) {
    var others = PRODUCTS.filter(function (p) {
      return p.id !== currentProduct.id && related.indexOf(p) === -1;
    });
    related = related.concat(others.slice(0, 4 - related.length));
  }

  container.innerHTML = related.map(generateProductCard).join('');
}

/* ===== RENDER REVIEWS ===== */
function renderReviews() {
  var reviewList = document.getElementById('review-list');
  if (!reviewList) return;

  var countEl = document.getElementById('review-count');
  if (countEl) countEl.textContent = REVIEWS.length;

  reviewList.innerHTML = REVIEWS.map(function (review) {
    var initials = review.name.split(' ').map(function (n) {
      return n[0];
    }).join('');
    var formattedDate = new Date(review.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return '<div class="review-card">' +
      '<div class="review-avatar">' + initials + '</div>' +
      '<div class="review-content">' +
      '<div class="review-header">' +
      '<span class="review-name">' + review.name + '</span>' +
      '<span class="review-date">' + formattedDate + '</span>' +
      '</div>' +
      '<div class="review-rating">' + generateStars(review.rating, 16) + '</div>' +
      '<p class="review-text">' + review.text + '</p>' +
      '</div>' +
      '</div>';
  }).join('');
}

/* ===== RATING DISTRIBUTION ===== */
function renderRatingDistribution() {
  var container = document.getElementById('rating-distribution');
  if (!container) return;

  var totalReviews = Object.values(RATING_DISTRIBUTION).reduce(function (a, b) {
    return a + b;
  }, 0);

  var html = '';
  for (var i = 5; i >= 1; i--) {
    var count = RATING_DISTRIBUTION[i] || 0;
    var pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    html += '<div class="rating-bar">' +
      '<div class="rating-bar-label">' + i + ' <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.482 20.34a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg></div>' +
      '<div class="rating-bar-track"><div class="rating-bar-fill" style="width: ' + pct + '%"></div></div>' +
      '<span class="rating-bar-count">' + count + '</span>' +
      '</div>';
  }
  container.innerHTML = html;
}

/* ===== RATING SUMMARY ===== */
function renderRatingSummary() {
  var numberEl = document.getElementById('rating-summary-number');
  var starsEl = document.getElementById('rating-summary-stars');
  var countEl = document.getElementById('rating-summary-count');
  if (!numberEl) return;

  var product = getCurrentProduct();
  if (!product) return;

  numberEl.textContent = product.rating.toFixed(1);
  if (starsEl) starsEl.innerHTML = generateStars(product.rating, 24);
  if (countEl) countEl.textContent = 'Based on ' + product.reviews + ' reviews';
}

/* ===== ADD REVIEW FORM ===== */
function initAddReviewForm() {
  var form = document.getElementById('add-review-form');
  if (!form) return;

  var nameInput = form.querySelector('#reviewer-name');
  var commentInput = form.querySelector('#review-comment');
  var ratingInputs = form.querySelectorAll('.rating-selector input');
  var selectedRating = 5;

  ratingInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      selectedRating = parseInt(this.value, 10);
      /* Update star visuals */
      form.querySelectorAll('.rating-selector svg').forEach(function (svg, idx) {
        if (idx < selectedRating) {
          svg.classList.add('selected');
        } else {
          svg.classList.remove('selected');
        }
      });
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;

    if (!nameInput.value.trim()) {
      showToast('Please enter your name', 'error');
      valid = false;
    }
    if (!commentInput.value.trim()) {
      showToast('Please write a comment', 'error');
      valid = false;
    }

    if (valid) {
      /* Add review dynamically */
      var reviewList = document.getElementById('review-list');
      var initials = nameInput.value.trim().split(' ').map(function (n) {
        return n[0];
      }).join('').toUpperCase().slice(0, 2);
      var now = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      var newReview = '<div class="review-card">' +
        '<div class="review-avatar">' + initials + '</div>' +
        '<div class="review-content">' +
        '<div class="review-header">' +
        '<span class="review-name">' + nameInput.value.trim() + '</span>' +
        '<span class="review-date">' + now + '</span>' +
        '</div>' +
        '<div class="review-rating">' + generateStars(selectedRating, 16) + '</div>' +
        '<p class="review-text">' + commentInput.value.trim() + '</p>' +
        '</div>' +
        '</div>';

      reviewList.insertAdjacentHTML('afterbegin', newReview);

      /* Update review count */
      var countEl = document.getElementById('review-count');
      if (countEl) {
        var currentCount = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = currentCount + 1;
      }
      var summaryCount = document.getElementById('rating-summary-count');
      var product = getCurrentProduct();
      if (summaryCount && product) {
        product.reviews++;
        summaryCount.textContent = 'Based on ' + product.reviews + ' reviews';
      }

      showToast('Review submitted successfully!', 'success');
      form.reset();
      /* Reset star selector */
      form.querySelectorAll('.rating-selector svg').forEach(function (svg, idx) {
        if (idx < 5) {
          svg.classList.add('selected');
        }
      });
      selectedRating = 5;
    }
  });
}

/* ===== INIT ON DOM READY ===== */
document.addEventListener('DOMContentLoaded', function () {
  renderProductDetails();
  initProductTabs();
  renderRelatedProducts();
  renderReviews();
  renderRatingDistribution();
  renderRatingSummary();
  initAddReviewForm();
});
