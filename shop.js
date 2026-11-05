(function() {
    var state = {
        category: new URLSearchParams(location.search).get('category') || 'all',
        search: '',
        rating: 0,
        min: 0,
        max: Infinity,
        discount: 0,
        sort: 'default'
    };

    function esc(v) {
        return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    function stars(r) {
        return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r))
    }

    function card(p) {
        var wished = typeof isInWishlist === 'function' && isInWishlist(p.id);
        return '<article class="ec-card"><div class="ec-card-img"><span class="ec-badge">' + esc(p.badge || 'Featured') + '</span><button class="ec-heart ' + (wished ? 'active' : '') + '" data-wish="' + p.id + '">' + (wished ? '♥' : '♡') + '</button><a href="product-details.html?id=' + p.id + '"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy"></a></div><div class="ec-card-body"><span class="ec-cat">' + esc(p.category) + '</span><h3 class="ec-name"><a href="product-details.html?id=' + p.id + '">' + esc(p.name) + '</a></h3><div class="ec-rating">' + stars(p.rating) + ' <span class="muted">(' + p.reviews + ')</span></div><div class="ec-price"><strong>EGB ' + p.price.toFixed(2) + '</strong><span class="ec-old">EGB ' + p.oldPrice.toFixed(2) + '</span></div><div class="ec-actions"><button class="btn btn-primary" data-cart="' + p.id + '">Add to Cart</button><a class="btn btn-secondary" href="product-details.html?id=' + p.id + '">View</a></div></div></article>'
    }

    function filter() {
        var list = PRODUCTS.filter(function(p) {
            return (state.category === 'all' || p.category === state.category) && (!state.search || [p.name, p.category, p.brand].join(' ').toLowerCase().includes(state.search.toLowerCase())) && p.rating >= state.rating && p.price >= state.min && p.price <= state.max && (p.discount || 0) >= state.discount
        });
        if (state.sort === 'price-low') list.sort((a, b) => a.price - b.price);
        if (state.sort === 'price-high') list.sort((a, b) => b.price - a.price);
        if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
        if (state.sort === 'discount') list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        return list
    }

    function render() {
        var list = filter(),
            grid = document.getElementById('shop-grid');
        grid.innerHTML = list.map(card).join('');
        document.getElementById('shop-count').textContent = list.length;
        document.getElementById('shop-empty').hidden = list.length !== 0;
        bind()
    }

    function bind() {
        document.querySelectorAll('[data-cart]').forEach(function(b) {
            b.onclick = function() {
                var p = PRODUCTS.find(x => x.id === Number(b.dataset.cart));
                if (p && typeof addToCart === 'function') addToCart(p)
            }
        });
        document.querySelectorAll('[data-wish]').forEach(function(b) {
            b.onclick = function() {
                var p = PRODUCTS.find(x => x.id === Number(b.dataset.wish));
                if (p && typeof toggleWishlist === 'function') {
                    var added = toggleWishlist(p);
                    b.classList.toggle('active', added);
                    b.textContent = added ? '♥' : '♡';
                }
            }
        })
    }
    document.addEventListener('DOMContentLoaded', function() {
        var select = document.getElementById('filter-category');
        CATEGORIES.forEach(c => {
            var o = document.createElement('option');
            o.value = c.name;
            o.textContent = c.name;
            select.appendChild(o)
        });
        select.value = state.category;
        document.getElementById('shop-search').oninput = e => {
            state.search = e.target.value;
            render()
        };
        document.getElementById('sort-products').onchange = e => {
            state.sort = e.target.value;
            render()
        };
        document.getElementById('filter-category').onchange = e => {
            state.category = e.target.value;
            render()
        };
        document.getElementById('filter-rating').onchange = e => {
            state.rating = Number(e.target.value);
            render()
        };
        document.getElementById('min-price').oninput = e => {
            state.min = Number(e.target.value) || 0;
            render()
        };
        document.getElementById('max-price').oninput = e => {
            state.max = Number(e.target.value) || Infinity;
            render()
        };
        document.getElementById('filter-discount').onchange = e => {
            state.discount = Number(e.target.value);
            render()
        };
        document.getElementById('clear-filters').onclick = function() {
            state = {
                category: 'all',
                search: '',
                rating: 0,
                min: 0,
                max: Infinity,
                discount: 0,
                sort: 'default'
            };
            document.querySelectorAll('.ec-input').forEach(x => x.value = '');
            document.getElementById('filter-category').value = 'all';
            document.getElementById('filter-rating').value = '0';
            document.getElementById('filter-discount').value = '0';
            document.getElementById('sort-products').value = 'default';
            render()
        };
        render()
    })
})();