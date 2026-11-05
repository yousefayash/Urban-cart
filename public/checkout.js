document.addEventListener('DOMContentLoaded', function() {
    var cart = JSON.parse(localStorage.getItem('urbancart_cart') || '[]');
    var items = cart.map(i => PRODUCTS.find(p => p.id === Number(i.id)) ? {
        ...PRODUCTS.find(p => p.id === Number(i.id)),
        quantity: i.quantity
    } : null).filter(Boolean);
    var box = document.getElementById('checkout-items');
    var subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
    box.innerHTML = items.length ? items.map(i => '<div class="summary-line" style="margin-bottom:8px"><span>' + i.name + ' × ' + i.quantity + '</span><strong>EGB ' + (i.price * i.quantity).toFixed(2) + '</strong></div>').join('') : '<p class="muted">Your cart is empty.</p>';
    var shipping = items.length ? 40 : 0;
    document.getElementById('checkout-subtotal').textContent = 'EGB ' + subtotal.toFixed(2);
    document.getElementById('checkout-shipping').textContent = 'EGB ' + shipping.toFixed(2);
    document.getElementById('checkout-total').textContent = 'EGB ' + (subtotal + shipping).toFixed(2);
    document.getElementById('checkout-form').addEventListener('submit', function(e) {
        e.preventDefault();
        if (!items.length) {
            alert('Your cart is empty.');
            return
        }
        var order = {
            id: 'UC-' + Date.now().toString().slice(-8),
            date: new Date().toLocaleString(),
            status: 'Processing',
            customer: {
                name: document.getElementById('customer-name').value,
                email: document.getElementById('customer-email').value,
                phone: document.getElementById('customer-phone').value,
                city: document.getElementById('customer-city').value,
                address: document.getElementById('customer-address').value
            },
            items: items.map(i => ({
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                image: i.image
            })),
            total: subtotal + shipping
        };
        var orders = JSON.parse(localStorage.getItem('urbancart_orders') || '[]');
        orders.unshift(order);
        localStorage.setItem('urbancart_orders', JSON.stringify(orders));
        localStorage.removeItem('urbancart_cart');
        localStorage.setItem('urbancart_last_order', order.id);
        location.href = 'order-success.html?id=' + order.id
    })
});