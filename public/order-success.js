/* URBAN CART - ORDER SUCCESS MODULE (API-BOUND) */
document.addEventListener('DOMContentLoaded', async function() {
    var params = new URLSearchParams(window.location.search);
    var orderId = params.get('id');

    var detailsBox = document.getElementById('success-details');
    var token = localStorage.getItem('urbancart_token');

    if (!token) {
        if (detailsBox) {
            detailsBox.innerHTML = '<p class="muted">Please sign in to view your order.</p>';
        }
        var trackLink = document.querySelector('.ec-actions .btn-primary');
        if (trackLink) trackLink.href = 'orders.html';
        var shopLink = document.querySelector('.ec-actions .btn-secondary');
        if (shopLink) shopLink.href = 'shop.html';
        return;
    }

    if (!orderId) {
        if (detailsBox) {
            detailsBox.innerHTML = '<p class="muted">Order reference not found.</p>';
        }
        return;
    }

    try {
        var response = await fetch('/api/orders/' + encodeURIComponent(orderId), {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        var data = await response.json().catch(function() { return {}; });

        if (!response.ok) {
            if (detailsBox) {
                detailsBox.textContent = data.error || 'Order not found.';
            }
            return;
        }

        function esc(v) {
            return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        var customer = data.customer || {};
        var itemsHtml = (data.items || []).map(function(i) {
            return '<div class="summary-line"><span>' + esc(i.name) + ' × ' + Math.max(0, Number(i.quantity) || 0) + '</span><strong>EGB ' + Number(i.price).toFixed(2) + '</strong></div>';
        }).join('');

        if (detailsBox) {
            detailsBox.innerHTML =
                '<div class="summary-line"><span>Order ID</span><strong>' + esc(String(data.id)) + '</strong></div>' +
                '<div class="summary-line"><span>Customer</span><strong>' + esc(customer.name || 'Customer') + '</strong></div>' +
                '<div class="summary-line"><span>Email</span><strong>' + esc(customer.email || '—') + '</strong></div>' +
                '<div class="summary-line"><span>Address</span><strong>' + esc(customer.address || data.shipping_address || '—') + '</strong></div>' +
                '<div class="summary-line"><span>Total</span><strong>EGB ' + Number(data.total).toFixed(2) + '</strong></div>' +
                '<div class="summary-line"><span>Status</span><strong>' + esc(data.status || 'pending') + '</strong></div>' +
                (itemsHtml ? '<div style="margin-top:12px"><span>Items</span><div>' + itemsHtml + '</div></div>' : '');
        }
    } catch (err) {
        if (detailsBox) {
            detailsBox.innerHTML = '<p class="muted">Could not load order details.</p>';
        }
    }
});