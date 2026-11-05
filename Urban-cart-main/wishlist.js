/* ============================================
   URBAN CART - PREMIUM WISHLIST MODULE
   ============================================ */

(function () {
  var WISHLIST_KEY = 'urbancart_wishlist';
  var currentView = 'grid';
  var currentSort = 'recent';
  var searchTerm = '';
  var pendingAction = null;

  function getWishlist() {
    try {
      var data = localStorage.getItem(WISHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  function saveWishlist(items) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    if (typeof updateWishlistCounter === 'function') updateWishlistCounter();
  }

  function productById(id) {
    if (typeof PRODUCTS === 'undefined') return null;
    return PRODUCTS.find(function (product) {
      return product.id === Number(id);
    }) || null;
  }

  function normalizeItems() {
    var items = getWishlist();
    if (typeof PRODUCTS === 'undefined') return items;

    return items.map(function (item) {
      return productById(item.id) || item;
    });
  }

  function stars(rating) {
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.482 20.34a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 00.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>';
    }
    return html;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getFilteredItems() {
    var items = normalizeItems();

    if (searchTerm) {
      var term = searchTerm.toLowerCase();
      items = items.filter(function (item) {
        return (item.name || '').toLowerCase().includes(term) ||
          (item.category || '').toLowerCase().includes(term) ||
          (item.brand || '').toLowerCase().includes(term);
      });
    }

    if (currentSort === 'price-low') {
      items.sort(function (a, b) { return a.price - b.price; });
    } else if (currentSort === 'price-high') {
      items.sort(function (a, b) { return b.price - a.price; });
    } else if (currentSort === 'rating') {
      items.sort(function (a, b) { return b.rating - a.rating; });
    } else if (currentSort === 'name') {
      items.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else if (currentSort === 'discount') {
      items.sort(function (a, b) { return (b.discount || 0) - (a.discount || 0); });
    }

    return items;
  }

  function render() {
    var grid = document.getElementById('wishlist-grid');
    var empty = document.getElementById('wishlist-empty');
    var toolbar = document.getElementById('wishlist-toolbar');
    var countEl = document.getElementById('wishlist-count');
    var toolbarCount = document.getElementById('toolbar-count');

    if (!grid || !empty) return;

    var allItems = normalizeItems();
    var items = getFilteredItems();

    if (countEl) countEl.textContent = allItems.length;
    if (toolbarCount) {
      toolbarCount.textContent = allItems.length + (allItems.length === 1 ? ' item' : ' items');
    }

    if (!allItems.length) {
      grid.innerHTML = '';
      grid.classList.remove('list-view');
      empty.classList.remove('hidden');
      if (toolbar) toolbar.classList.add('hidden');
      return;
    }

    if (!items.length) {
      grid.innerHTML = '<div class="wishlist-no-results"><div class="no-results-icon">⌕</div><h2>No products found</h2><p>Try another search term.</p></div>';
      grid.classList.remove('list-view');
      empty.classList.add('hidden');
      if (toolbar) toolbar.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    if (toolbar) toolbar.classList.remove('hidden');

    grid.classList.toggle('list-view', currentView === 'list');
    grid.innerHTML = items.map(renderCard).join('');
    bindCardEvents();
  }

  function renderCard(product) {
    var outOfStock = product.stock && product.stock.toLowerCase().includes('out');
    var badge = product.badge || '';
    var badgeClass = badge.toLowerCase() === 'new' ? 'new' : badge.toLowerCase() === 'sale' ? 'sale' : '';

    return '<article class="wish-card' + (outOfStock ? ' out-stock' : '') + '" data-id="' + product.id + '">' +
      '<div class="wish-image-wrap">' +
        (badge ? '<span class="wish-badge ' + badgeClass + '">' + escapeHtml(badge) + '</span>' : '') +
        '<button class="wish-heart remove-wish" data-id="' + product.id + '" type="button" aria-label="Remove ' + escapeHtml(product.name) + ' from wishlist">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path fill="currentColor" stroke="none" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>' +
        '</button>' +
        '<a href="product-details.html?id=' + product.id + '">' +
          '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' +
        '</a>' +
      '</div>' +
      '<div class="wish-body">' +
        '<span class="wish-category">' + escapeHtml(product.category) + '</span>' +
        '<h3 class="wish-name"><a href="product-details.html?id=' + product.id + '">' + escapeHtml(product.name) + '</a></h3>' +
        '<div class="wish-rating"><div class="wish-stars">' + stars(product.rating) + '</div><span class="wish-reviews">(' + escapeHtml(product.reviews) + ')</span></div>' +
        '<div class="wish-prices"><span class="wish-current">EGB ' + Number(product.price).toFixed(2) + '</span>' +
          (product.oldPrice ? '<span class="wish-old">EGB ' + Number(product.oldPrice).toFixed(2) + '</span>' : '') +
        '</div>' +
        '<span class="wish-stock">' + escapeHtml(product.stock || 'In Stock') + '</span>' +
        '<div class="wish-actions">' +
          '<button class="wish-add add-wish-cart" data-id="' + product.id + '" type="button" ' + (outOfStock ? 'disabled' : '') + '>' + (outOfStock ? 'Out of Stock' : 'Add to Cart') + '</button>' +
          '<a class="wish-view" href="product-details.html?id=' + product.id + '" aria-label="View ' + escapeHtml(product.name) + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573 3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function bindCardEvents() {
    document.querySelectorAll('.remove-wish').forEach(function (button) {
      button.addEventListener('click', function () {
        removeItem(Number(this.dataset.id));
      });
    });

    document.querySelectorAll('.add-wish-cart').forEach(function (button) {
      button.addEventListener('click', function () {
        var product = productById(Number(this.dataset.id));
        if (!product || this.disabled) return;

        if (typeof addToCart === 'function') {
          addToCart(product, 1);
          this.textContent = 'Added ✓';
          this.disabled = true;
          var btn = this;
          setTimeout(function () {
            btn.textContent = 'Add to Cart';
            btn.disabled = false;
          }, 1200);
        }
      });
    });
  }

  function removeItem(id) {
    var items = getWishlist();
    var removed = items.find(function (item) { return Number(item.id) === id; });
    items = items.filter(function (item) { return Number(item.id) !== id; });
    saveWishlist(items);
    render();

    if (typeof showToast === 'function') {
      showToast('Removed from wishlist', 'warning');
    }

    if (removed) {
      var undo = document.querySelector('.toast:last-child');
      if (undo) {
        var message = undo.querySelector('.toast-message');
        if (message) {
          message.innerHTML = 'Removed from wishlist <button class="wishlist-undo" type="button">Undo</button>';
          var undoBtn = message.querySelector('.wishlist-undo');
          undoBtn.addEventListener('click', function () {
            var latest = getWishlist();
            if (!latest.some(function (item) { return Number(item.id) === id; })) {
              latest.push(removed);
              saveWishlist(latest);
              render();
              showToast('Product restored', 'success');
            }
          });
        }
      }
    }
  }

  function openConfirm(type) {
    var modal = document.getElementById('confirm-modal');
    var title = document.getElementById('confirm-title');
    var text = document.getElementById('confirm-text');
    var confirm = document.getElementById('modal-confirm');

    if (!modal || !title || !text || !confirm) return;

    pendingAction = type;

    if (type === 'clear') {
      title.textContent = 'Clear your wishlist?';
      text.textContent = 'All saved products will be removed from your wishlist.';
      confirm.textContent = 'Clear Wishlist';
    } else {
      var available = normalizeItems().filter(function (item) {
        return !(item.stock && item.stock.toLowerCase().includes('out'));
      }).length;
      title.textContent = 'Move items to cart?';
      text.textContent = 'Add ' + available + ' available ' + (available === 1 ? 'product' : 'products') + ' to your cart.';
      confirm.textContent = 'Move to Cart';
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeConfirm() {
    var modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    pendingAction = null;
  }

  function confirmAction() {
    if (pendingAction === 'clear') {
      saveWishlist([]);
      render();
      closeConfirm();
      if (typeof showToast === 'function') showToast('Wishlist cleared', 'success');
      return;
    }

    if (pendingAction === 'move') {
      var items = normalizeItems();
      var available = items.filter(function (item) {
        return !(item.stock && item.stock.toLowerCase().includes('out'));
      });

      if (typeof addToCart === 'function') {
        available.forEach(function (item) { addToCart(item, 1); });
      }

      closeConfirm();
      if (typeof showToast === 'function') {
        showToast(available.length + ' item' + (available.length === 1 ? '' : 's') + ' moved to cart', 'success');
      }
    }
  }

  function initSearch() {
    var inputs = [
      document.getElementById('wishlist-search'),
      document.getElementById('mobile-wishlist-search')
    ];

    inputs.forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () {
        searchTerm = this.value.trim();
        inputs.forEach(function (other) {
          if (other && other !== this) other.value = searchTerm;
        }, this);
        render();
      });
    });
  }

  function init() {
    var sort = document.getElementById('wishlist-sort');
    if (sort) {
      sort.addEventListener('change', function () {
        currentSort = this.value;
        render();
      });
    }

    document.querySelectorAll('.view-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelectorAll('.view-btn').forEach(function (btn) { btn.classList.remove('active'); });
        this.classList.add('active');
        currentView = this.dataset.view;
        render();
      });
    });

    var moveAll = document.getElementById('move-all-btn');
    var clearAll = document.getElementById('clear-all-btn');
    if (moveAll) moveAll.addEventListener('click', function () { openConfirm('move'); });
    if (clearAll) clearAll.addEventListener('click', function () { openConfirm('clear'); });

    var close = document.getElementById('modal-close');
    var cancel = document.getElementById('modal-cancel');
    var confirm = document.getElementById('modal-confirm');
    var backdrop = document.getElementById('confirm-modal');

    if (close) close.addEventListener('click', closeConfirm);
    if (cancel) cancel.addEventListener('click', closeConfirm);
    if (confirm) confirm.addEventListener('click', confirmAction);
    if (backdrop) {
      backdrop.addEventListener('click', function (event) {
        if (event.target === backdrop) closeConfirm();
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeConfirm();
    });

    initSearch();
    render();
    if (typeof updateWishlistCounter === 'function') updateWishlistCounter();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.getWishlist = getWishlist;
  window.isInWishlist = function (id) {
    return getWishlist().some(function (item) { return Number(item.id) === Number(id); });
  };
  window.toggleWishlist = function (product) {
    var items = getWishlist();
    var index = items.findIndex(function (item) { return Number(item.id) === Number(product.id); });

    if (index >= 0) {
      items.splice(index, 1);
      saveWishlist(items);
      if (document.getElementById('wishlist-grid')) render();
      if (typeof showToast === 'function') showToast('Removed from wishlist', 'warning');
      return false;
    }

    items.push(product);
    saveWishlist(items);
    if (document.getElementById('wishlist-grid')) render();
    if (typeof showToast === 'function') showToast('Added to wishlist', 'success');
    return true;
  };

  window.removeFromWishlist = removeItem;
  window.updateWishlistCounter = window.updateWishlistCounter || function () {
    var count = getWishlist().length;
    document.querySelectorAll('.wishlist-badge').forEach(function (badge) {
      badge.textContent = count;
      badge.style.display = count ? 'flex' : 'none';
    });
  };
  window.updateWishlistButtons = function () {
    document.querySelectorAll('.product-card-wishlist').forEach(function (button) {
      var id = Number(button.dataset.productId);
      button.classList.toggle('active', window.isInWishlist(id));
    });
  };
  window.initWishlistButtons = window.updateWishlistButtons;
})();
