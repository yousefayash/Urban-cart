document.addEventListener('DOMContentLoaded', function () {
  var key = 'urbancart_profile';
  var userKey = 'urbancart_user';
  var tokenKey = 'urbancart_token';

  var profile = JSON.parse(localStorage.getItem(key) || 'null');
  var user = JSON.parse(localStorage.getItem(userKey) || 'null');
  var token = localStorage.getItem(tokenKey);

  var data = profile || user || {};

  if (data.name) {
    var nameInput = document.getElementById('profile-name');
    var nameSide = document.getElementById('profile-name-side');
    var avatar = document.querySelector('.avatar');
    if (nameInput) nameInput.value = data.name;
    if (nameSide) nameSide.textContent = data.name;
    if (avatar) avatar.textContent = data.name.charAt(0).toUpperCase();
  }
  if (data.email) {
    var emailInput = document.getElementById('profile-email');
    if (emailInput) emailInput.value = data.email;
  }
  if (data.phone) {
    var phoneInput = document.getElementById('profile-phone');
    if (phoneInput) phoneInput.value = data.phone;
  }
  if (data.city) {
    var cityInput = document.getElementById('profile-city');
    if (cityInput) cityInput.value = data.city;
  }
  if (data.address) {
    var addressInput = document.getElementById('profile-address');
    if (addressInput) addressInput.value = data.address;
  }

  // Add Sign In / Sign Out button in sidebar
  var accountNav = document.querySelector('.account-nav');
  if (accountNav) {
    var authLink = document.createElement('a');
    authLink.style.cursor = 'pointer';
    if (token) {
      authLink.textContent = 'Sign Out';
      authLink.style.color = 'var(--color-error, #ef4444)';
      authLink.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        if (typeof showToast === 'function') showToast('Signed out successfully', 'info');
        setTimeout(function () { window.location.href = 'signin.html'; }, 800);
      });
    } else {
      authLink.textContent = 'Sign In';
      authLink.href = 'signin.html';
    }
    accountNav.appendChild(authLink);
  }

  var form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var updated = {
        name: document.getElementById('profile-name').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        phone: document.getElementById('profile-phone').value.trim(),
        city: document.getElementById('profile-city').value.trim(),
        address: document.getElementById('profile-address').value.trim()
      };
      localStorage.setItem(key, JSON.stringify(updated));

      var nameSide = document.getElementById('profile-name-side');
      var avatar = document.querySelector('.avatar');
      if (nameSide) nameSide.textContent = updated.name;
      if (avatar && updated.name) avatar.textContent = updated.name.charAt(0).toUpperCase();

      var msg = document.getElementById('profile-message');
      if (msg) {
        msg.textContent = 'Profile saved successfully.';
        msg.style.color = 'var(--color-success, #10b981)';
        setTimeout(function () { msg.textContent = ''; }, 3500);
      }
      if (typeof showToast === 'function') showToast('Profile saved successfully.', 'success');
    });
  }
});
