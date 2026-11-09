/* URBAN CART - ORDER SUCCESS MODULE (API-BOUND) */
document.addEventListener('DOMContentLoaded', async function() {
    var params = new URLSearchParams(window.location.search);
    var orderId = params.get('id');

    var orderBox = document.getElementById('order-success');
    var token = localStorage.getItem('urbancart_token');

    if (!token) {
        if (orderBox) {
            orderBox.innerHTML = '<p class="muted">Please sign in to view your order.</p>';
        }
        var signinLink = document.querySelector('.order-success-actions a');
        if (signinLink) signinLink.href = 'signin.html?redirect=order-success.html';
        return;
    }

    if (!orderId) {
        if (orderBox) {
            orderBox.innerHTML = '<p class="muted">Order reference not found.</p>';
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
            if (orderBox) {
                orderBox.innerHTML = '<p class="muted">' + (data.error || 'Order not found.') + '</p>';
            }
            return;
        }

        function esc(v) {
            return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        var customer = data.customer || {};
        var itemsHtml = (data.items || []).map(function(i) {
            return '<div class="order-success-item"><div><strong>' + esc(i.name) + '</strong><span>× ' + i.quantity + '</span></div><div>EGB ' + Number(i.price).toFixed(2) + '</div></div>';
        }).join('');

        if (orderBox) {
            orderBox.innerHTML =
                '<div class="order-success-summary">' +
                '<span class="order-success-kicker">Order Confirmed</span>' +
                '<h1>Thank you for your purchase!</h1>' +
                '<p class="muted">Order ID: <strong>' + esc(String(data.id)) + '</strong></p>' +
                '<div class="order-success-details">' +
                '<div><span>Customer</span><strong>' + esc(customer.name || 'Customer') + '</strong></div>' +
                '<div><span>Email</span><strong>' + esc(customer.email || '—') + '</strong></div>' +
                '<div><span>Address</span><strong>' + esc(customer.address || data.shipping_address || '—') + '</strong></div>' +
                '<div><span>Total</span><strong>EGB ' + Number(data.total).toFixed(2) + '</strong></div>' +
                '<div><span>Status</span><strong>' + esc(data.status || 'pending') + '</strong></div>' +
                '</div>' +
                '<div class="order-success-items">' + itemsHtml + '</div>' +
                '</div>';
        }
    } catch (err) {
        if (orderBox) {
            orderBox.innerHTML = '<p class="muted">Could not load order details.</p>';
        }
    }
});