document.addEventListener('DOMContentLoaded', function() {
    var key = 'urbancart_profile';
    var p = JSON.parse(localStorage.getItem(key) || 'null');
    if (p) {
        Object.keys(p).forEach(k => {
            var el = document.getElementById('profile-' + k);
            if (el) el.value = p[k] || ''
        });
        document.getElementById('profile-name-side').textContent = p.name || 'Urban Customer'
    }
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var data = {
            name: document.getElementById('profile-name').value,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value,
            city: document.getElementById('profile-city').value,
            address: document.getElementById('profile-address').value
        };
        localStorage.setItem(key, JSON.stringify(data));
        document.getElementById('profile-name-side').textContent = data.name;
        document.getElementById('profile-message').textContent = 'Profile saved successfully.'
    })
});