document.addEventListener('DOMContentLoaded', function() {
    var key = 'urbancart_profile';
    var p = JSON.parse(localStorage.getItem(key) || 'null');
    var nameSide = document.getElementById('profile-name-side');
    var avatar = document.getElementById('profile-avatar');
    if (p) {
        Object.keys(p).forEach(k => {
            var el = document.getElementById('profile-' + k);
            if (el) el.value = p[k] || ''
        });
        var name = p.name || 'Urban Customer';
        if (nameSide) nameSide.textContent = name;
        if (avatar) avatar.textContent = name.trim().charAt(0).toUpperCase();
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
        if (nameSide) nameSide.textContent = data.name;
        if (avatar) avatar.textContent = data.name.trim().charAt(0).toUpperCase();
        localStorage.setItem('urbancart_account_session', 'active');
        document.getElementById('profile-message').textContent = 'Profile saved successfully.'
    })
});
