/* URBAN CART - ORDERS MODULE (API-BOUND) */
document.addEventListener('DOMContentLoaded', async function() {
    var list = document.getElementById('orders-list');
    var empty = document.getElementById('orders-empty');
    var token = localStorage.getItem('urbancart_token');

    if (!token) {
        if (empty) empty.hidden = false;
        if (list) list.innerHTML = '';
        var emptyState = document.querySelector('.orders-empty-state');
        if (emptyState) {
            emptyState.innerHTML = '<p class="muted">Please sign in to view your orders.</p>';
            var link = document.createElement('a');
            link.href = 'signin.html?redirect=orders.html';
            link.className = 'btn btn-primary';
            link.textContent = 'Sign In';
            emptyState.appendChild(link);
        }
        return;
    }

    try {
        var response = await fetch('/api/orders', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        var data = await response.json().catch(function() { return []; });

        if (!response.ok) {
            if (empty) empty.hidden = false;
            if (list) list.innerHTML = '';
            return;
        }

        var orders = Array.isArray(data) ? data : [];

        if (!orders.length) {
            if (empty) empty.hidden = false;
            if (list) list.innerHTML = '';
            return;
        }

        if (empty) empty.hidden = true;

        function esc(v) {
            return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        list.innerHTML = orders.map(function(o) {
            var items = (o.items || []).map(function(i) { return esc(i.name) + ' × ' + i.quantity; }).join(', ');
            var dateStr = o.date || (o.created_at ? new Date(o.created_at).toLocaleString() : '—');
            var status = esc(o.status || 'pending');
            return '<article class="page-card order-card"><div><span class="ec-kicker">' + esc(String(o.id)) + '</span><h2 style="margin:6px 0">EGB ' + Number(o.total).toFixed(2) + '</h2><p class="muted">' + esc(dateStr) + '</p><p style="margin-top:8px">' + (items || '—') + '</p></div><div style="text-align:right"><span class="status">' + status + '</span><p class="muted" style="margin:10px 0">Processing → Shipped → Out for Delivery → Delivered</p><button class="btn btn-secondary track-btn" data-id="' + esc(String(o.id)) + '">Track Order</button></div></article>';
        }).join('');

        document.querySelectorAll('.track-btn').forEach(function(b) {
            b.onclick = function() {
                var o = orders.find(function(x) { return String(x.id) === b.dataset.id; });
                if (o) {
                    alert('Order ' + o.id + ' is currently: ' + (o.status || 'pending'));
                }
            };
        });
    } catch (err) {
        if (empty) empty.hidden = false;
        if (list) list.innerHTML = '';
    }
});