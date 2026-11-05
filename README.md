# Urban Cart - Expanded E-commerce

Updated existing Urban Cart project with a connected 50-product catalog and additional shopping flows.

## Main additions
- 50 products in one shared `data.js` catalog
- Dynamic product details: `product-details.html?id=PRODUCT_ID`
- Category cards linked to filtered Shop results
- Shop page with search, filters and sorting
- Search Results page
- Wishlist and Cart integration with localStorage
- Checkout and Order Success flow
- Orders History / basic tracking
- Profile / Account page
- Dark-mode toggle beside the cart in the header
- Responsive layouts for desktop, laptop, tablet and mobile
- Existing authentication/product/review pages preserved

## Run

This project can be opened directly as static HTML, or run with Vite:

```bash
npm install
npm run dev
```

## Product logic

All product cards use the shared `PRODUCTS` array. Product details are loaded by ID, so opening `product-details.html?id=25` shows product 25 only. No separate duplicate product data is created for each details page.
