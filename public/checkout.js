/* URBAN CART - CHECKOUT MODULE (API-BOUND) */
document.addEventListener('DOMContentLoaded', function() {
    var cart = JSON.parse(localStorage.getItem('urbancart_cart') || '[]');
    var items = cart.map(function(i) {
        var p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(function(p) { return p.id === Number(i.id); }) : null;
        var quantity = Math.max(1, Math.min(99, Number(i.quantity) || 1));
        return p ? Object.assign({}, p, { quantity: quantity }) : null;
    }).filter(Boolean);
    var box = document.getElementById('checkout-items');
    var subtotal = items.reduce(function(t, i) { return t + i.price * i.quantity; }, 0);
    var shipping = items.length ? 40 : 0;
    var total = subtotal + shipping;

    function esc(v) {
        return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    if (box) {
        box.innerHTML = items.length ? items.map(function(i) {
            return '<div class="summary-line" style="margin-bottom:8px"><span>' + esc(i.name) + ' × ' + i.quantity + '</span><strong>EGB ' + (i.price * i.quantity).toFixed(2) + '</strong></div>';
        }).join('') : '<p class="muted">Your cart is empty.</p>';
    }

    var subtotalEl = document.getElementById('checkout-subtotal');
    var shippingEl = document.getElementById('checkout-shipping');
    var totalEl = document.getElementById('checkout-total');
    if (subtotalEl) subtotalEl.textContent = 'EGB ' + subtotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = 'EGB ' + shipping.toFixed(2);
    if (totalEl) totalEl.textContent = 'EGB ' + total.toFixed(2);

    var form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!items.length) {
            showToast('Your cart is empty.', 'error');
            return;
        }

        var token = localStorage.getItem('urbancart_token');
        if (!token) {
            showToast('Please sign in to complete your order.', 'error');
            location.href = 'signin.html?redirect=checkout.html';
            return;
        }

        var submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            var shippingAddress = document.getElementById('customer-address').value.trim();
            var paymentMethod = document.getElementById('payment-method').value === 'Card Payment' ? 'card' : 'cash';

            var response = await fetch('/api/orders/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    shippingAddress: shippingAddress,
                    paymentMethod: paymentMethod
                })
            });

            var data = await response.json().catch(function() { return {}; });

            if (!response.ok) {
                showToast(data.error || 'Order failed. Please try again.', 'error');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            localStorage.removeItem('urbancart_cart');
            if (typeof updateCartCounter === 'function') updateCartCounter();
            localStorage.setItem('urbancart_last_order', String(data.id));
            location.href = 'order-success.html?id=' + encodeURIComponent(data.id);
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});