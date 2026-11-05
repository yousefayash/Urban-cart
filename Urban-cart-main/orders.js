document.addEventListener('DOMContentLoaded', async function () {
  var list = document.getElementById('orders-list');
  var empty = document.getElementById('orders-empty');
  if (!list || !empty) return;

  var orders = JSON.parse(localStorage.getItem('urbancart_orders') || '[]');

  // Check if token exists, try fetching from backend
  var token = localStorage.getItem('urbancart_token');
  if (token) {
    try {
      var res = await fetch('http://localhost:3000/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        var backendOrders = await res.json();
        if (Array.isArray(backendOrders) && backendOrders.length) {
          // Merge backend orders
          backendOrders.forEach(function (bo) {
            var exists = orders.find(function (o) { return String(o.id) === 'ORD-' + bo.id || String(o.id) === String(bo.id); });
            if (!exists) {
              orders.push({
                id: 'ORD-' + bo.id,
                date: new Date(bo.createdAt || Date.now()).toLocaleString(),
                status: bo.status ? bo.status.charAt(0).toUpperCase() + bo.status.slice(1) : 'Processing',
                total: bo.total,
                items: (bo.items || []).map(function (it) {
                  return { id: it.id, name: it.name, price: it.price, quantity: it.quantity };
                })
              });
            }
          });
          localStorage.setItem('urbancart_orders', JSON.stringify(orders));
        }
      }
    } catch (e) {
      console.warn('Could not fetch backend orders:', e);
    }
  }

  if (!orders.length) {
    empty.hidden = false;
    list.innerHTML = '';
    return;
  }

  empty.hidden = true;
  list.innerHTML = orders.map(function (o) {
    var items = (o.items || []).map(function (i) {
      return (i.name || 'Item') + ' × ' + (i.quantity || 1);
    }).join(', ');

    var statusClass = (o.status || 'Processing').toLowerCase().replace(/\s+/g, '-');

    return '<article class="page-card order-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">' +
      '<div>' +
      '<span class="ec-kicker">' + (o.id || 'Order') + '</span>' +
      '<h2 style="margin:6px 0;font-size:1.4rem;">EGB ' + Number(o.total || 0).toFixed(2) + '</h2>' +
      '<p class="muted" style="font-size:0.9rem;">' + (o.date || 'Recent') + '</p>' +
      '<p style="margin-top:8px;font-size:0.95rem;color:var(--color-text);">' + items + '</p>' +
      '</div>' +
      '<div style="text-align:right">' +
      '<span class="status status-' + statusClass + '" style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:0.85rem;font-weight:600;background:var(--color-bg-secondary, #f3f4f6);">' + (o.status || 'Processing') + '</span>' +
      '<p class="muted" style="margin:10px 0;font-size:0.85rem;">Processing → Shipped → Out for Delivery → Delivered</p>' +
      '<button class="btn btn-secondary track-btn" data-id="' + o.id + '">Track Order</button>' +
      '</div>' +
      '</article>';
  }).join('');

  document.querySelectorAll('.track-btn').forEach(function (b) {
    b.onclick = function () {
      var o = orders.find(function (x) { return x.id === b.dataset.id; });
      if (o) {
        if (typeof showToast === 'function') {
          showToast('Order ' + o.id + ' status: ' + (o.status || 'Processing'), 'info');
        } else {
          alert('Order ' + o.id + ' is currently: ' + (o.status || 'Processing'));
        }
      }
    };
  });
});
