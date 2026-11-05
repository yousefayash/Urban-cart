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
      /* Every page needs to be listed here, otherwise only index.html is built */
      input: {
        index: page('index.html'),
        productDetails: page('product-details.html'),
        cart: page('cart.html'),
        wishlist: page('wishlist.html'),
        shop: page('shop.html'),
        categories: page('categories.html'),
        checkout: page('checkout.html'),
        orders: page('orders.html'),
        orderSuccess: page('order-success.html'),
        profile: page('profile.html'),
        search: page('search.html'),
        signin: page('signin.html'),
        signup: page('signup.html'),
        forgotPassword: page('forgot-password.html'),
        resetPassword: page('reset-password.html')
      }
    }
  }
})
