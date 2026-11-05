(function() {
    function esc(v) {
        return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    function card(p) {
        return '<article class="ec-card"><div class="ec-card-img"><span class="ec-badge">' + esc(p.badge || 'Product') + '</span><a href="product-details.html?id=' + p.id + '"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '"></a></div><div class="ec-card-body"><span class="ec-cat">' + esc(p.category) + '</span><h3 class="ec-name"><a href="product-details.html?id=' + p.id + '">' + esc(p.name) + '</a></h3><div class="ec-rating">' + ('★'.repeat(Math.round(p.rating))) + ' <span class="muted">' + p.rating + '</span></div><div class="ec-price"><strong>EGB ' + p.price.toFixed(2) + '</strong><span class="ec-old">EGB ' + p.oldPrice.toFixed(2) + '</span></div><div class="ec-actions"><button class="btn btn-primary" data-id="' + p.id + '">Add to Cart</button><a class="btn btn-secondary" href="product-details.html?id=' + p.id + '">View</a></div></div></article>'
    }

    function render() {
        var q = new URLSearchParams(location.search).get('q') || '';
        var term = q.toLowerCase();
        var list = PRODUCTS.filter(p => [p.name, p.category, p.brand].concat(p.tags || []).join(' ').toLowerCase().includes(term));
        var sort = document.getElementById('search-sort').value;
        if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
        if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
        if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
        if (sort === 'discount') list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        document.getElementById('search-label').textContent = q ? 'Showing results for “' + q + '”.' : 'Showing the full catalog.';
        document.getElementById('search-count').textContent = list.length + ' result' + (list.length === 1 ? '' : 's');
        document.getElementById('search-grid').innerHTML = list.map(card).join('');
        document.getElementById('search-empty').hidden = !!list.length;
        document.querySelectorAll('[data-id]').forEach(b => b.onclick = function() {
            var p = PRODUCTS.find(x => x.id === Number(this.dataset.id));
            if (p && typeof addToCart === 'function') addToCart(p)
        })
    }
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('search-sort').onchange = render;
        render()
    })
})();