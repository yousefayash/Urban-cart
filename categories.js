function escapeCategoryHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>\"']/g, function (char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char];
    });
}
function safeCategoryImage(value) {
    try { var u = new URL(String(value || ''), location.origin); return (u.protocol === 'https:' || (u.protocol === 'http:' && u.origin === location.origin)) ? u.href : ''; }
    catch (_) { return ''; }
}
document.addEventListener('DOMContentLoaded', function() {
    var grid = document.getElementById('category-grid');
    grid.innerHTML = CATEGORIES.map(function(c) {
        var count = PRODUCTS.filter(p => p.category === c.name).length;
        return '<a class="category-feature" href="shop.html?category=' + encodeURIComponent(c.name) + '"><img src="' + escapeCategoryHTML(safeCategoryImage(c.image)) + '" alt="' + escapeCategoryHTML(c.name) + '"><div class="category-feature-content"><h2>' + escapeCategoryHTML(c.name) + '</h2><p>' + escapeCategoryHTML(c.description) + '</p><strong>' + count + ' products →</strong></div></a>'
    }).join('')
});