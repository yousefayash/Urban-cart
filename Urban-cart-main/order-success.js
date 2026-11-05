document.addEventListener('DOMContentLoaded', function() {
    var id = new URLSearchParams(location.search).get('id') || localStorage.getItem('urbancart_last_order');
    var orders = JSON.parse(localStorage.getItem('urbancart_orders') || '[]');
    var o = orders.find(function(x) {
        return x.id === id;
    }) || orders[0];
    var box = document.getElementById('success-details');
    if (!box) return;

    if (!o) {
        box.innerHTML = '<p class="muted">No recent order found.</p>';
        return;
    }

    box.innerHTML =
        '<div class="summary-line"><span>Order ID</span><strong>' + (o.id || '-') + '</strong></div>' +
        '<div class="summary-line"><span>Date</span><strong>' + (o.date || new Date().toLocaleString()) + '</strong></div>' +
        '<div class="summary-line"><span>Status</span><strong>' + (o.status || 'Processing') + '</strong></div>' +
        '<div class="summary-line"><span>Total</span><strong>EGB ' + Number(o.total || 0).toFixed(2) + '</strong></div>';
});