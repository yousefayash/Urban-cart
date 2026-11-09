(function () {
  'use strict';

  var TOKEN_KEY = 'urbancart_token';
  var USER_KEY = 'urbancart_user';

  function apiRequest(url, options) {
    options = options || {};
    options.headers = Object.assign({
      'Content-Type': 'application/json'
    }, options.headers || {});

    var token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      options.headers.Authorization = 'Bearer ' + token;
    }

    return fetch('/api' + url, options).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong.');
        }
        return data;
      });
    });
  }

  function showMessage(form, message, success) {
    var old = form.querySelector('.auth-message');
    if (old) old.remove();

    var box = document.createElement('div');
    box.className = 'auth-message ' + (success ? 'form-success' : 'form-error');
    box.textContent = message;
    form.insertBefore(box, form.firstChild);
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function saveSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(
      'urbancart_account_session',
      'active'
    );

    if (data.user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'index.html';
    }
  }

  function initPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        var input = this.closest('.input-wrapper').querySelector('input');
        if (!input) return;

        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });
  }

  function initSignIn() {
    var form = document.getElementById('signin-form');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      var email = form.querySelector('#signin-email').value.trim().toLowerCase();
      var password = form.querySelector('#signin-password').value;

      if (!validEmail(email)) {
        showMessage(form, 'Please enter a valid email address.', false);
        return;
      }

      if (!password) {
        showMessage(form, 'Please enter your password.', false);
        return;
      }

      var button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;

      try {
        var data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email, password: password })
        });

        saveSession(data);
      } catch (error) {
        showMessage(form, error.message, false);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  function initSignUp() {
    var form = document.getElementById('signup-form');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      var name = form.querySelector('#signup-name').value.trim();
      var email = form.querySelector('#signup-email').value.trim().toLowerCase();
      var password = form.querySelector('#signup-password').value;
      var confirm = form.querySelector('#signup-confirm').value;
      var terms = form.querySelector('#signup-terms');

      if (name.length < 2) {
        showMessage(form, 'Name must be at least 2 characters.', false);
        return;
      }

      if (!validEmail(email)) {
        showMessage(form, 'Please enter a valid email address.', false);
        return;
      }

      if (password.length < 8) {
        showMessage(form, 'Password must be at least 8 characters.', false);
        return;
      }

      if (password !== confirm) {
        showMessage(form, 'Passwords do not match.', false);
        return;
      }

      if (terms && !terms.checked) {
        showMessage(form, 'Please accept the Terms & Conditions.', false);
        return;
      }

      var button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;

      try {
        var data = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name,
            email: email,
            password: password
          })
        });

        saveSession(data);
      } catch (error) {
        showMessage(form, error.message, false);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  function initPasswordStrength() {
    var input = document.getElementById('signup-password');
    if (!input) return;

    input.addEventListener('input', function () {
      var score = 0;
      var password = this.value;

      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      var strength = score <= 1 ? 'weak' :
        score <= 2 ? 'fair' :
        score <= 3 ? 'good' : 'strong';

      var fill = document.querySelector('.password-strength-fill');
      var label = document.querySelector('.password-strength-label');

      if (fill) fill.className = 'password-strength-fill ' + strength;
      if (label) {
        label.textContent = {
          weak: 'Weak',
          fair: 'Fair',
          good: 'Good',
          strong: 'Strong'
        }[strength];
      }
    });
  }

  function initPasswordRecovery() {
    var reset = document.getElementById('reset-password-form');

    if (reset) {
      reset.addEventListener('submit', function (event) {
        event.preventDefault();
        showMessage(
          reset,
          'Password reset is not available yet.',
          false
        );
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggle();
    initPasswordStrength();
    initSignIn();
    initSignUp();
    initPasswordRecovery();
  });
})();