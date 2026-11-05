(function () {
  'use strict';

  var ADMIN_EMAIL = 'admin@example.com';
  var ADMIN_PASSWORD = 'admin123456';
  var SESSION_KEY = 'urbancart_admin_session';
  var ORDERS_KEY = 'urbancart_orders';

  function readOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (error) { return []; }
  }

  function readProducts() {
    return Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function formatMoney(value) {
    return 'EGB ' + Number(value || 0).toFixed(2);
  }

  function getCustomers(orders) {
    var seen = {};
    orders.forEach(function (order) {
      var customer = order.customer || {};
      var email = String(customer.email || 'guest@example.com').toLowerCase();
      if (!seen[email]) seen[email] = { name: customer.name || 'Guest customer', email: customer.email || 'Guest checkout', city: customer.city || '—', orders: 0, total: 0 };
      seen[email].orders += 1;
      seen[email].total += Number(order.total || 0);
    });
    return Object.keys(seen).map(function (key) { return seen[key]; }).sort(function (a, b) { return b.total - a.total; });
  }

  function renderStats(orders, products, customers) {
    var revenue = orders.reduce(function (sum, order) { return sum + Number(order.total || 0); }, 0);
    document.getElementById('stat-revenue').textContent = formatMoney(revenue);
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-customers').textContent = customers.length;
    document.getElementById('orders-count').textContent = orders.length + (orders.length === 1 ? ' order' : ' orders');
    document.getElementById('products-count').textContent = products.length + (products.length === 1 ? ' product' : ' products');
  }

  function renderOrders(orders) {
    var table = document.getElementById('orders-table');
    var empty = document.getElementById('orders-empty');
    empty.hidden = orders.length > 0;
    table.innerHTML = orders.slice(0, 20).map(function (order) {
      var customer = order.customer || {};
      var status = String(order.status || 'Processing').toLowerCase();
      var options = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
      return '<tr><td><strong class="order-id">' + escapeHtml(order.id) + '</strong><span class="cell-muted">' + (order.items || []).length + ' item(s)</span></td>' +
        '<td><strong>' + escapeHtml(customer.name || 'Guest customer') + '</strong><span class="cell-muted">' + escapeHtml(customer.email || '—') + '</span></td>' +
        '<td class="cell-muted">' + escapeHtml(order.date || '—') + '</td><td><strong>' + formatMoney(order.total) + '</strong></td>' +
        '<td><select class="status-select status-' + status.replace(/\s+/g, '-') + '" data-order-id="' + escapeHtml(order.id) + '">' + options.map(function (option) { return '<option ' + (option.toLowerCase() === status ? 'selected' : '') + '>' + option + '</option>'; }).join('') + '</select></td>' +
        '<td><button class="order-view" data-order-id="' + escapeHtml(order.id) + '" type="button" aria-label="View order details">View</button></td></tr>';
    }).join('');
  }

  function renderProducts(products, query) {
    var q = String(query || '').toLowerCase();
    var filtered = products.filter(function (product) { return !q || [product.name, product.category, product.brand, product.sku].join(' ').toLowerCase().indexOf(q) !== -1; });
    document.getElementById('products-table').innerHTML = filtered.map(function (product) {
      var stock = product.stock === 'In Stock' ? 25 : (Number(product.stock) || 0);
      return '<tr><td><div class="product-cell"><img src="' + escapeHtml(product.image) + '" alt=""><strong>' + escapeHtml(product.name) + '</strong></div></td><td class="cell-muted">' + escapeHtml(product.category) + '</td><td class="cell-muted">' + escapeHtml(product.sku || '—') + '</td><td><strong>' + formatMoney(product.price) + '</strong></td><td><span class="stock-pill ' + (stock > 0 ? 'in-stock' : 'out-stock') + '">' + (stock > 0 ? stock + ' in stock' : 'Out of stock') + '</span></td></tr>';
    }).join('') || '<tr><td colspan="5" class="table-empty">No products match your search.</td></tr>';
  }

  function renderCustomers(customers) {
    var list = document.getElementById('customers-list');
    document.getElementById('customers-empty').hidden = customers.length > 0;
    list.innerHTML = customers.slice(0, 8).map(function (customer) {
      var initials = String(customer.name).split(' ').map(function (part) { return part[0]; }).join('').slice(0, 2).toUpperCase();
      return '<div class="customer-row"><span class="customer-avatar">' + escapeHtml(initials) + '</span><div class="customer-info"><strong>' + escapeHtml(customer.name) + '</strong><span>' + escapeHtml(customer.email) + ' · ' + escapeHtml(customer.city) + '</span></div><div class="customer-spend"><strong>' + formatMoney(customer.total) + '</strong><span>' + customer.orders + (customer.orders === 1 ? ' order' : ' orders') + '</span></div></div>';
    }).join('');
  }

  function refresh() {
    var orders = readOrders();
    var products = readProducts();
    var customers = getCustomers(orders);
    renderStats(orders, products, customers);
    renderOrders(orders);
    renderProducts(products, document.getElementById('product-search').value);
    renderCustomers(customers);
  }

  function openDashboard() {
    document.getElementById('admin-login-view').hidden = true;
    document.getElementById('admin-dashboard-view').hidden = false;
    document.getElementById('dashboard-date').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
    refresh();
  }

  function showLogin() {
    document.getElementById('admin-login-view').hidden = false;
    document.getElementById('admin-dashboard-view').hidden = true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('admin-login-form');
    var error = document.getElementById('admin-login-error');
    if (localStorage.getItem(SESSION_KEY) === 'active') openDashboard();
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = document.getElementById('admin-email').value.trim().toLowerCase();
      var password = document.getElementById('admin-password').value;
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        error.textContent = 'Incorrect admin email or password.';
        error.hidden = false;
        return;
      }
      localStorage.setItem(SESSION_KEY, 'active');
      error.hidden = true;
      openDashboard();
    });
    document.getElementById('admin-logout').addEventListener('click', function () { localStorage.removeItem(SESSION_KEY); showLogin(); });
    document.getElementById('product-search').addEventListener('input', function () { renderProducts(readProducts(), this.value); });
    document.getElementById('orders-table').addEventListener('change', function (event) {
      if (!event.target.classList.contains('status-select')) return;
      var orders = readOrders();
      var order = orders.find(function (item) { return item.id === event.target.dataset.orderId; });
      if (order) { order.status = event.target.value; localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); refresh(); }
    });
    document.getElementById('orders-table').addEventListener('click', function (event) {
      var button = event.target.closest('.order-view');
      if (!button) return;
      var order = readOrders().find(function (item) { return item.id === button.dataset.orderId; });
      if (order) alert('Order ' + order.id + '\n\nCustomer: ' + ((order.customer || {}).name || 'Guest') + '\nAddress: ' + ((order.customer || {}).address || '—') + '\nTotal: ' + formatMoney(order.total));
    });
    window.addEventListener('storage', refresh);
  });
}());
