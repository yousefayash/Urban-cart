/* URBAN CART - PROFILE MODULE (API-BOUND) */
document.addEventListener('DOMContentLoaded', async function() {
    var token = localStorage.getItem('urbancart_token');
    var profileKey = 'urbancart_profile';

    if (!token) {
        location.href = 'signin.html?redirect=profile.html';
        return;
    }

    var user = null;
    try {
        var response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        var data = await response.json().catch(function() { return {}; });
        if (!response.ok || !data.user) {
            localStorage.removeItem('urbancart_token');
            localStorage.removeItem('urbancart_user');
            localStorage.removeItem('urbancart_account_session');
            location.href = 'signin.html?redirect=profile.html';
            return;
        }
        user = data.user;
    } catch (err) {
        localStorage.removeItem('urbancart_token');
        localStorage.removeItem('urbancart_user');
        localStorage.removeItem('urbancart_account_session');
        location.href = 'signin.html?redirect=profile.html';
        return;
    }

    var nameSide = document.getElementById('profile-name-side');
    var avatar = document.getElementById('profile-avatar');
    if (nameSide) nameSide.textContent = user.name || 'Urban Customer';
    if (avatar) avatar.textContent = (user.name || 'U').trim().charAt(0).toUpperCase();

    var form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        var data = {
            name: document.getElementById('profile-name').value,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value,
            city: document.getElementById('profile-city').value,
            address: document.getElementById('profile-address').value
        };
        localStorage.setItem(profileKey, JSON.stringify(data));
        localStorage.setItem('urbancart_account_session', 'active');
        var msg = document.getElementById('profile-message');
        if (msg) msg.textContent = 'Profile saved successfully.';

        try {
            await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(data)
            });
        } catch (err) {
            // Non-critical: local storage still holds the data
        }
    });
});