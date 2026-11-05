(function () {
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function card(p) {
    var wished = typeof isInWishlist === 'function' && isInWishlist(p.id);
    return '<article class="ec-card">' +
      '<div class="ec-card-img">' +
      '<span class="ec-badge">' + esc(p.badge || 'Product') + '</span>' +
      '<button class="ec-heart ' + (wished ? 'active' : '') + '" data-wish="' + p.id + '">' + (wished ? '♥' : '♡') + '</button>' +
      '<a href="product-details.html?id=' + p.id + '">' +
      '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + (typeof getProductFallback === 'function' ? getProductFallback(p) : '') + '\'">' +
      '</a>' +
      '</div>' +
      '<div class="ec-card-body">' +
      '<span class="ec-cat">' + esc(p.category) + '</span>' +
      '<h3 class="ec-name"><a href="product-details.html?id=' + p.id + '">' + esc(p.name) + '</a></h3>' +
      '<div class="ec-rating">' + ('★'.repeat(Math.round(p.rating || 0))) + ' <span class="muted">(' + (p.reviews || 0) + ')</span></div>' +
      '<div class="ec-price"><strong>EGB ' + Number(p.price || 0).toFixed(2) + '</strong>' +
      (p.oldPrice ? '<span class="ec-old">EGB ' + Number(p.oldPrice).toFixed(2) + '</span>' : '') +
      '</div>' +
      '<div class="ec-actions">' +
      '<button class="btn btn-primary" data-id="' + p.id + '">Add to Cart</button>' +
      '<a class="btn btn-secondary" href="product-details.html?id=' + p.id + '">View</a>' +
      '</div>' +
      '</div>' +
      '</article>';
  }

  function render() {
    if (typeof PRODUCTS === 'undefined') return;

    var q = new URLSearchParams(location.search).get('q') || '';
    var term = q.toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      return [p.name, p.category, p.brand].concat(p.tags || []).join(' ').toLowerCase().includes(term);
    });

    var sortEl = document.getElementById('search-sort');
    var sort = sortEl ? sortEl.value : 'default';

    if (sort === 'price-low') list.sort(function (a, b) { return a.price - b.price; });
    if (sort === 'price-high') list.sort(function (a, b) { return b.price - a.price; });
    if (sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating; });
    if (sort === 'discount') list.sort(function (a, b) { return (b.discount || 0) - (a.discount || 0); });

    var labelEl = document.getElementById('search-label');
    var countEl = document.getElementById('search-count');
    var gridEl = document.getElementById('search-grid');
    var emptyEl = document.getElementById('search-empty');

    if (labelEl) labelEl.textContent = q ? 'Showing results for “' + q + '”.' : 'Showing the full catalog.';
    if (countEl) countEl.textContent = list.length + ' result' + (list.length === 1 ? '' : 's');
    if (gridEl) gridEl.innerHTML = list.map(card).join('');
    if (emptyEl) emptyEl.hidden = !!list.length;

    // Attach Add to Cart
    document.querySelectorAll('[data-id]').forEach(function (b) {
      b.onclick = function () {
        var p = PRODUCTS.find(function (x) { return x.id === Number(b.dataset.id); });
        if (p && typeof addToCart === 'function') {
          addToCart(p);
        }
      };
    });

    // Attach Wishlist
    document.querySelectorAll('[data-wish]').forEach(function (b) {
      b.onclick = function () {
        var p = PRODUCTS.find(function (x) { return x.id === Number(b.dataset.wish); });
        if (p && typeof toggleWishlist === 'function') {
          var added = toggleWishlist(p);
          b.classList.toggle('active', added);
          b.textContent = added ? '♥' : '♡';
        }
      };
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sortEl = document.getElementById('search-sort');
    if (sortEl) sortEl.onchange = render;
    render();
  });
})();
