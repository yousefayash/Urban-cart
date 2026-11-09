(function () {
  'use strict';

  var TOKEN_KEY = 'urbancart_token';
  var orders = [];
  var products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];

  function api(url, options) {
    options = options || {};
    options.headers = Object.assign({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem(TOKEN_KEY) || '')
    }, options.headers || {});

    return fetch('/api' + url, options).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) throw new Error(data.error || 'Request failed');
        return data;
      });
    });
  }

  function money(value) {
    return 'EGB ' + Number(value || 0).toFixed(2);
  }

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[char];
    });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('urbancart_user');
    localStorage.removeItem('urbancart_admin_session');
    localStorage.removeItem('urbancart_account_session');
    window.location.href = 'signin.html';
  }

  function showDashboard() {
    document.getElementById('admin-login-view').hidden = true;
    document.getElementById('admin-dashboard-view').hidden = false;

    document.getElementById('dashboard-date').textContent =
      new Intl.DateTimeFormat('en', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date());
  }

  function renderStats(stats) {
    document.getElementById('stat-revenue').textContent = money(stats.revenue);
    document.getElementById('stat-orders').textContent = stats.orders;
    document.getElementById('stat-products').textContent = stats.products;
    document.getElementById('stat-customers').textContent = stats.users;

    document.getElementById('orders-count').textContent =
      orders.length + (orders.length === 1 ? ' order' : ' orders');

    document.getElementById('products-count').textContent =
      products.length + (products.length === 1 ? ' product' : ' products');
  }

  function renderOrders() {
    var table = document.getElementById('orders-table');
    var empty = document.getElementById('orders-empty');

    empty.hidden = orders.length > 0;

    var statuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    ];

    table.innerHTML = orders.map(function (order) {
      var customer = order.customer || {};
      var status = String(order.status || 'pending').toLowerCase();

      return '<tr>' +
        '<td><strong class="order-id">' + escape(order.id) + '</strong></td>' +
        '<td><strong>' + escape(customer.name || 'Customer') +
        '</strong><span class="cell-muted">' +
        escape(customer.email || '—') + '</span></td>' +
        '<td class="cell-muted">' + escape(order.date || order.created_at || '—') + '</td>' +
        '<td><strong>' + money(order.total) + '</strong></td>' +
        '<td><select class="status-select" data-order-id="' + escape(order.id) + '">' +
        statuses.map(function (item) {
          return '<option value="' + item + '" ' +
            (item === status ? 'selected' : '') + '>' +
            item.charAt(0).toUpperCase() + item.slice(1) +
            '</option>';
        }).join('') +
        '</select></td>' +
        '<td><button class="order-view" data-order-id="' +
        escape(order.id) + '" type="button">View</button></td>' +
        '</tr>';
    }).join('');
  }

  function renderProducts(query) {
    var q = String(query || '').toLowerCase();

    var filtered = products.filter(function (product) {
      return !q || [
        product.name,
        product.category,
        product.brand,
        product.sku
      ].join(' ').toLowerCase().includes(q);
    });

    document.getElementById('products-table').innerHTML =
      filtered.map(function (product) {
        var stock = Number(product.stock) || 0;

        return '<tr>' +
          '<td><div class="product-cell"><img src="' +
          escape(product.image) + '" alt=""><strong>' +
          escape(product.name) + '</strong></div></td>' +
          '<td>' + escape(product.category) + '</td>' +
          '<td>' + escape(product.sku || '—') + '</td>' +
          '<td><strong>' + money(product.price) + '</strong></td>' +
          '<td><span class="stock-pill ' +
          (stock > 0 ? 'in-stock' : 'out-stock') + '">' +
          (stock > 0 ? stock + ' in stock' : 'Out of stock') +
          '</span></td></tr>';
      }).join('') ||
      '<tr><td colspan="5" class="table-empty">No products match your search.</td></tr>';
  }

  function renderCustomers() {
    var customers = {};

    orders.forEach(function (order) {
      var customer = order.customer || {};
      var email = customer.email || 'unknown';

      if (!customers[email]) {
        customers[email] = {
          name: customer.name || 'Customer',
          email: email,
          total: 0,
          count: 0
        };
      }

      customers[email].total += Number(order.total || 0);
      customers[email].count++;
    });

    var list = Object.keys(customers).map(function (key) {
      return customers[key];
    });

    document.getElementById('customers-empty').hidden = list.length > 0;

    document.getElementById('customers-list').innerHTML =
      list.slice(0, 8).map(function (customer) {
        var initials = customer.name.split(' ')
          .map(function (part) { return part[0] || ''; })
          .join('').slice(0, 2).toUpperCase();

        return '<div class="customer-row">' +
          '<span class="customer-avatar">' + escape(initials) + '</span>' +
          '<div class="customer-info"><strong>' +
          escape(customer.name) + '</strong><span>' +
          escape(customer.email) + '</span></div>' +
          '<div class="customer-spend"><strong>' +
          money(customer.total) + '</strong><span>' +
          customer.count + ' orders</span></div></div>';
      }).join('');
  }

  async function refresh() {
    var results = await Promise.all([
      api('/admin/stats'),
      api('/admin/orders')
    ]);

    orders = Array.isArray(results[1]) ? results[1] : [];

    renderStats(results[0]);
    renderOrders();
    renderProducts(document.getElementById('product-search').value);
    renderCustomers();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    var token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      logout();
      return;
    }

    try {
      var session = await api('/auth/me');

      if (!session.user || session.user.role !== 'admin') {
        logout();
        return;
      }

      showDashboard();
      await refresh();
    } catch (error) {
      logout();
      return;
    }

    document.getElementById('admin-logout')
      .addEventListener('click', logout);

    document.getElementById('product-search')
      .addEventListener('input', function () {
        renderProducts(this.value);
      });

    document.getElementById('orders-table')
      .addEventListener('change', async function (event) {
        if (!event.target.classList.contains('status-select')) return;

        var id = event.target.dataset.orderId;

        try {
          await api('/admin/orders/' + encodeURIComponent(id), {
            method: 'PATCH',
            body: JSON.stringify({
              status: event.target.value
            })
          });

          await refresh();
        } catch (error) {
          alert(error.message);
          await refresh();
        }
      });

    document.getElementById('orders-table')
      .addEventListener('click', function (event) {
        var button = event.target.closest('.order-view');
        if (!button) return;

        var order = orders.find(function (item) {
          return String(item.id) === button.dataset.orderId;
        });

        if (!order) return;

        var customer = order.customer || {};

        alert(
          'Order: ' + order.id +
          '\nCustomer: ' + (customer.name || 'Customer') +
          '\nEmail: ' + (customer.email || '—') +
          '\nAddress: ' + (customer.address || order.shipping_address || '—') +
          '\nTotal: ' + money(order.total)
        );
      });
  });
})();