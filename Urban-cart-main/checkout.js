document.addEventListener('DOMContentLoaded', function () {
  var cart = JSON.parse(localStorage.getItem('urbancart_cart') || '[]');
  var items = cart.map(function (i) {
    var p = typeof PRODUCTS !== 'undefined' ? PRODUCTS.find(function (x) { return x.id === Number(i.id); }) : null;
    return p ? { ...p, quantity: i.quantity } : null;
  }).filter(Boolean);

  // Pre-fill profile info if available
  try {
    var profile = JSON.parse(localStorage.getItem('urbancart_profile') || 'null');
    var user = JSON.parse(localStorage.getItem('urbancart_user') || 'null');
    var nameField = document.getElementById('customer-name');
    var emailField = document.getElementById('customer-email');
    var phoneField = document.getElementById('customer-phone');
    var cityField = document.getElementById('customer-city');
    var addressField = document.getElementById('customer-address');

    if (profile) {
      if (nameField && profile.name) nameField.value = profile.name;
      if (emailField && profile.email) emailField.value = profile.email;
      if (phoneField && profile.phone) phoneField.value = profile.phone;
      if (cityField && profile.city) cityField.value = profile.city;
      if (addressField && profile.address) addressField.value = profile.address;
    } else if (user) {
      if (nameField && user.name) nameField.value = user.name;
      if (emailField && user.email) emailField.value = user.email;
    }
  } catch (e) {}

  var box = document.getElementById('checkout-items');
  var subtotal = items.reduce(function (t, i) { return t + i.price * i.quantity; }, 0);
  var shipping = items.length ? 40 : 0;
  var total = subtotal + shipping;

  if (box) {
    box.innerHTML = items.length ? items.map(function (i) {
      return '<div class="summary-line" style="margin-bottom:8px"><span>' +
        i.name + ' × ' + i.quantity + '</span><strong>EGB ' + (i.price * i.quantity).toFixed(2) + '</strong></div>';
    }).join('') : '<p class="muted">Your cart is empty.</p>';
  }

  var subtotalEl = document.getElementById('checkout-subtotal');
  var shippingEl = document.getElementById('checkout-shipping');
  var totalEl = document.getElementById('checkout-total');
  if (subtotalEl) subtotalEl.textContent = 'EGB ' + subtotal.toFixed(2);
  if (shippingEl) shippingEl.textContent = 'EGB ' + shipping.toFixed(2);
  if (totalEl) totalEl.textContent = 'EGB ' + total.toFixed(2);

  var form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!items.length) {
        if (typeof showToast === 'function') showToast('Your cart is empty.', 'error');
        else alert('Your cart is empty.');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      var name = document.getElementById('customer-name').value.trim();
      var email = document.getElementById('customer-email').value.trim();
      var phone = document.getElementById('customer-phone').value.trim();
      var city = document.getElementById('customer-city').value.trim();
      var address = document.getElementById('customer-address').value.trim();
      var paymentMethod = (document.getElementById('payment-method')?.value || '').toLowerCase().includes('card') ? 'card' : 'cash';

      var fullShippingAddress = `${name}, ${phone}, ${address}, ${city}`;
      var orderId = 'UC-' + Date.now().toString().slice(-8);

      var order = {
        id: orderId,
        date: new Date().toLocaleString(),
        status: 'Processing',
        paymentMethod: paymentMethod,
        customer: { name, email, phone, city, address },
        items: items.map(function (i) {
          return { id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image };
        }),
        total: total
      };

      // Try sending to backend if user has token
      var token = localStorage.getItem('urbancart_token');
      if (token) {
        try {
          // Sync cart to backend first to ensure checkout works
          for (const item of items) {
            await fetch(`http://localhost:3000/api/cart/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ quantity: item.quantity })
            });
          }

          const res = await fetch('http://localhost:3000/api/orders/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ shippingAddress: fullShippingAddress, paymentMethod: paymentMethod })
          });

          if (res.ok) {
            const backendOrder = await res.json();
            if (backendOrder && backendOrder.id) {
              order.id = 'ORD-' + backendOrder.id;
            }
          }
        } catch (err) {
          console.warn('Backend order checkout fallback to local:', err);
        }
      }

      // Save locally
      var orders = JSON.parse(localStorage.getItem('urbancart_orders') || '[]');
      orders.unshift(order);
      localStorage.setItem('urbancart_orders', JSON.stringify(orders));
      localStorage.removeItem('urbancart_cart');
      localStorage.setItem('urbancart_last_order', order.id);

      // Save address to profile for next time
      try {
        var existingProfile = JSON.parse(localStorage.getItem('urbancart_profile') || '{}');
        localStorage.setItem('urbancart_profile', JSON.stringify({
          ...existingProfile,
          name: name || existingProfile.name,
          email: email || existingProfile.email,
          phone: phone || existingProfile.phone,
          city: city || existingProfile.city,
          address: address || existingProfile.address
        }));
      } catch (e) {}

      window.location.href = 'order-success.html?id=' + encodeURIComponent(order.id);
    });
  }
});
