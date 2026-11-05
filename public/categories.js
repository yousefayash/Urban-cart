document.addEventListener('DOMContentLoaded', function() {
    var grid = document.getElementById('category-grid');
    grid.innerHTML = CATEGORIES.map(function(c) {
        var count = PRODUCTS.filter(p => p.category === c.name).length;
        return '<a class="category-feature" href="shop.html?category=' + encodeURIComponent(c.name) + '"><img src="' + c.image + '" alt="' + c.name + '"><div class="category-feature-content"><h2>' + c.name + '</h2><p>' + c.description + '</p><strong>' + count + ' products →</strong></div></a>'
    }).join('')
});