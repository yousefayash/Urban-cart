
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const page = (name) => resolve(__dirname, name)

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: page('index.html'),
        shop: page('shop.html'),
        categories: page('categories.html'),
        search: page('search.html'),
        productDetails: page('product-details.html'),
        cart: page('cart.html'),
        checkout: page('checkout.html'),
        orderSuccess: page('order-success.html'),
        orders: page('orders.html'),
        wishlist: page('wishlist.html'),
        signin: page('signin.html'),
        signup: page('signup.html'),
        forgotPassword: page('forgot-password.html'),
        resetPassword: page('reset-password.html'),
        admin: page('admin.html'),
        profile: page('profile.html'),
        view: page('view.html')
      }
    }
  }
})
