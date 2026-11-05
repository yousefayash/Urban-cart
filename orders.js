document.addEventListener('DOMContentLoaded', function() {
    var list = document.getElementById('orders-list'),
        empty = document.getElementById('orders-empty'),
        orders = JSON.parse(localStorage.getItem('urbancart_orders') || '[]');
    if (!orders.length) {
        empty.hidden = false;
        return
    }
    list.innerHTML = orders.map(function(o) {
        var items = o.items.map(i => i.name + ' × ' + i.quantity).join(', ');
        return '<article class="page-card order-card"><div><span class="ec-kicker">' + o.id + '</span><h2 style="margin:6px 0">EGB ' + Number(o.total).toFixed(2) + '</h2><p class="muted">' + o.date + '</p><p style="margin-top:8px">' + items + '</p></div><div style="text-align:right"><span class="status">' + o.status + '</span><p class="muted" style="margin:10px 0">Processing → Shipped → Out for Delivery → Delivered</p><button class="btn btn-secondary track-btn" data-id="' + o.id + '">Track Order</button></div></article>'
    }).join('');
    document.querySelectorAll('.track-btn').forEach(function(b) {
        b.onclick = function() {
            var o = orders.find(x => x.id === b.dataset.id);
            alert('Order ' + o.id + ' is currently: ' + o.status)
        }
    })
});