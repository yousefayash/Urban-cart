/* ============================================
   URBAN CART - AUTH MODULE
   Sign In, Sign Up, Forgot & Reset validation
   ============================================ */

/* ===== HELPER FUNCTIONS ===== */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+EGB /.test(email);
}

function isValidPassword(password) {
  return password.length >= 6;
}

function getPasswordStrength(password) {
  var score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 'weak';
  if (score <= 2) return 'fair';
  if (score <= 3) return 'good';
  return 'strong';
}

function showFieldError(input, message) {
  input.classList.add('error');
  input.classList.remove('success');
  var group = input.closest('.form-group');
  if (!group) return;
  var existing = group.querySelector('.form-error');
  if (existing) existing.remove();
  var error = document.createElement('div');
  error.className = 'form-error';
  error.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg><span>' + message + '</span>';
  group.appendChild(error);
}

function clearFieldError(input) {
  input.classList.remove('error');
  var group = input.closest('.form-group');
  if (!group) return;
  var error = group.querySelector('.form-error');
  if (error) error.remove();
}

function showFormSuccess(message, container) {
  if (!container) container = document.body;
  var existing = container.querySelector('.form-success');
  if (existing) existing.remove();
  var success = document.createElement('div');
  success.className = 'form-success';
  success.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0018 0z"/></svg><span>' + message + '</span>';
  container.insertBefore(success, container.firstChild);
  setTimeout(function () {
    success.style.opacity = '0';
    success.style.transition = 'opacity 0.3s ease';
    setTimeout(function () {
      if (success.parentNode) success.remove();
    }, 300);
  }, 4000);
}

/* ===== PASSWORD SHOW/HIDE ===== */
function initPasswordToggle() {
  var toggleBtns = document.querySelectorAll('.password-toggle');
  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = this.closest('.input-wrapper').querySelector('input');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        this.querySelector('.eye-open').classList.remove('hidden');
        this.querySelector('.eye-closed').classList.add('hidden');
      } else {
        input.type = 'password';
        this.querySelector('.eye-open').classList.add('hidden');
        this.querySelector('.eye-closed').classList.remove('hidden');
      }
    });
  });
}

/* ===== PASSWORD STRENGTH METER ===== */
function initPasswordStrength() {
  var passwordInput = document.getElementById('signup-password');
  if (!passwordInput) return;
  passwordInput.addEventListener('input', function () {
    var strength = getPasswordStrength(this.value);
    var fill = document.querySelector('.password-strength-fill');
    var label = document.querySelector('.password-strength-label');
    if (!fill || !label) return;
    fill.className = 'password-strength-fill ' + strength;
    var labels = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' };
    label.textContent = labels[strength] || '';
  });
}

/* ===== SIGN IN VALIDATION ===== */
function initSignInForm() {
  var form = document.getElementById('signin-form');
  if (!form) return;

  var emailInput = form.querySelector('#signin-email');
  var passwordInput = form.querySelector('#signin-password');

  /* Clear errors on input */
  [emailInput, passwordInput].forEach(function (input) {
    if (input) {
      input.addEventListener('input', function () {
        clearFieldError(this);
      });
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, 'Email is required');
      valid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showFieldError(emailInput, 'Please enter a valid email address');
      valid = false;
    }

    if (!passwordInput.value) {
      showFieldError(passwordInput, 'Password is required');
      valid = false;
    } else if (!isValidPassword(passwordInput.value)) {
      showFieldError(passwordInput, 'Password must be at least 6 characters');
      valid = false;
    }

    if (valid) {
      showFormSuccess('Sign in successful! Redirecting...', form);
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1500);
    }
  });
}

/* ===== SIGN UP VALIDATION ===== */
function initSignUpForm() {
  var form = document.getElementById('signup-form');
  if (!form) return;

  var nameInput = form.querySelector('#signup-name');
  var emailInput = form.querySelector('#signup-email');
  var passwordInput = form.querySelector('#signup-password');
  var confirmInput = form.querySelector('#signup-confirm');
  var termsInput = form.querySelector('#signup-terms');

  [nameInput, emailInput, passwordInput, confirmInput].forEach(function (input) {
    if (input) {
      input.addEventListener('input', function () {
        clearFieldError(this);
      });
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;

    if (!nameInput.value.trim()) {
      showFieldError(nameInput, 'Full name is required');
      valid = false;
    } else if (nameInput.value.trim().length < 2) {
      showFieldError(nameInput, 'Name must be at least 2 characters');
      valid = false;
    }

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, 'Email is required');
      valid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showFieldError(emailInput, 'Please enter a valid email address');
      valid = false;
    }

    if (!passwordInput.value) {
      showFieldError(passwordInput, 'Password is required');
      valid = false;
    } else if (!isValidPassword(passwordInput.value)) {
      showFieldError(passwordInput, 'Password must be at least 6 characters');
      valid = false;
    }

    if (!confirmInput.value) {
      showFieldError(confirmInput, 'Please confirm your password');
      valid = false;
    } else if (confirmInput.value !== passwordInput.value) {
      showFieldError(confirmInput, 'Passwords do not match');
      valid = false;
    }

    if (termsInput && !termsInput.checked) {
      showToast('Please accept the Terms & Conditions', 'error');
      valid = false;
    }

    if (valid) {
      showFormSuccess('Account created successfully! Redirecting...', form);
      setTimeout(function () {
        window.location.href = 'signin.html';
      }, 1500);
    }
  });
}

/* ===== FORGOT PASSWORD VALIDATION ===== */
function initForgotPasswordForm() {
  var form = document.getElementById('forgot-password-form');
  if (!form) return;

  var emailInput = form.querySelector('#forgot-email');
  if (emailInput) {
    emailInput.addEventListener('input', function () {
      clearFieldError(this);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, 'Email is required');
      valid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
      showFieldError(emailInput, 'Please enter a valid email address');
      valid = false;
    }

    if (valid) {
      showFormSuccess('Password reset instructions have been sent to your email.', form);
      form.reset();
    }
  });
}

/* ===== RESET PASSWORD VALIDATION ===== */
function initResetPasswordForm() {
  var form = document.getElementById('reset-password-form');
  if (!form) return;

  var passwordInput = form.querySelector('#reset-password');
  var confirmInput = form.querySelector('#reset-confirm');

  [passwordInput, confirmInput].forEach(function (input) {
    if (input) {
      input.addEventListener('input', function () {
        clearFieldError(this);
      });
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;

    if (!passwordInput.value) {
      showFieldError(passwordInput, 'New password is required');
      valid = false;
    } else if (!isValidPassword(passwordInput.value)) {
      showFieldError(passwordInput, 'Password must be at least 6 characters');
      valid = false;
    }

    if (!confirmInput.value) {
      showFieldError(confirmInput, 'Please confirm your password');
      valid = false;
    } else if (confirmInput.value !== passwordInput.value) {
      showFieldError(confirmInput, 'Passwords do not match');
      valid = false;
    }

    if (valid) {
      showFormSuccess('Password has been reset successfully.', form);
      form.reset();
      setTimeout(function () {
        window.location.href = 'signin.html';
      }, 2000);
    }
  });
}

/* ===== INIT ON DOM READY ===== */
document.addEventListener('DOMContentLoaded', function () {
  initPasswordToggle();
  initPasswordStrength();
  initSignInForm();
  initSignUpForm();
  initForgotPasswordForm();
  initResetPasswordForm();
});
