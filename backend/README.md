# Urban Cart API

Production-oriented REST API for Urban Cart. It uses SQLite locally (WAL mode) and can be pointed at a managed database by replacing the database adapter for deployment. Authentication uses short-lived JWT access tokens, passwords use bcrypt, and all request bodies are validated with Zod.

## Run

```bash
cp backend/.env.example .env
npm install
npm run api:dev
```

The server binds to `0.0.0.0` and exposes `GET /api/health`. The catalog is seeded from the existing `data.js` on first start. Do not commit `.env` or `data/`.

## API surface

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/categories`, `GET /api/products` (query: `q`, `category`, `sort`, `page`, `limit`), `GET /api/products/:id`
- `GET/POST /api/products/:id/reviews`
- `GET /api/cart`, `PUT/DELETE /api/cart/:productId`
- `GET /api/wishlist`, `PUT/DELETE /api/wishlist/:productId`
- `POST /api/orders/checkout`, `GET /api/orders`, `GET /api/orders/:id`
- `GET /api/admin/stats`, `POST /api/admin/products`, `PATCH /api/admin/orders/:id`
- `GET /api/docs` (OpenAPI starter document)

Send `Authorization: Bearer <token>` for protected endpoints. A customer cannot access admin routes. The checkout transaction validates stock, snapshots item prices, decrements inventory, and clears the cart atomically. Card checkout is represented as `requires_payment`; connect a provider adapter (Stripe/Paymob) before accepting real card details—never send raw card data to this API.

## Deployment checklist

1. Set a strong `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_ORIGIN`, and a persistent `DATABASE_PATH` or migrate the adapter to PostgreSQL.
2. Put the API behind TLS and a reverse proxy; set a restrictive CORS origin.
3. Create the first admin through a controlled database migration/seed, not a public registration field.
4. Configure a payment provider webhook that marks orders paid only after signature verification.
5. Add centralized logs, backups, monitoring, and CI tests before launch.
