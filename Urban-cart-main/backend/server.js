import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db, publicUser, productView, orderView, initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-me';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'development-only-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : true, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }));

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  req[source] = parsed.data;
  next();
};

const sign = user => jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const admin = (req, res, next) => req.auth?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access required' });

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(160),
  password: z.string().min(8).max(128)
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
const productSchema = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().max(5000).default(''),
  category: z.string().trim().min(1).max(80),
  price: z.number().nonnegative(),
  oldPrice: z.number().nonnegative().nullable().optional(),
  image: z.string().url().nullable().optional(),
  brand: z.string().max(80).default(''),
  sku: z.string().max(80).nullable().optional(),
  stock: z.number().int().nonnegative().default(0)
});

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  service: 'urban-cart-api',
  database: 'laragon-mysql',
  time: new Date().toISOString()
}));

app.post('/api/auth/register', validate(registerSchema), asyncRoute(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (exists) return res.status(409).json({ error: 'Email is already registered' });
  const user = { name, email, password_hash: await bcrypt.hash(password, 12) };
  const result = await db.prepare('INSERT INTO users(name,email,password_hash) VALUES (@name,@email,@password_hash)').run(user);
  const created = await db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json({ user: publicUser(created), token: sign(created) });
}));

app.post('/api/auth/login', validate(loginSchema), asyncRoute(async (req, res) => {
  const user = await db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ user: publicUser(user), token: sign(user) });
}));

app.get('/api/auth/me', auth, asyncRoute(async (req, res) => {
  const user = await db.prepare('SELECT * FROM users WHERE id=?').get(req.auth.sub);
  res.json({ user: publicUser(user) });
}));

app.get('/api/categories', asyncRoute(async (req, res) => {
  const categories = await db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
}));

app.get('/api/products', asyncRoute(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || '');
  const sort = String(req.query.sort || 'newest');
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (q) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += ' AND category=?';
    params.push(category);
  }

  const orderMap = {
    price_asc: ' ORDER BY price ASC',
    price_desc: ' ORDER BY price DESC',
    rating: ' ORDER BY rating DESC',
    newest: ' ORDER BY created_at DESC'
  };
  sql += (orderMap[sort] || ' ORDER BY name ASC');

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const countSql = sql
    .replace(/ ORDER BY (price ASC|price DESC|rating DESC|created_at DESC|name ASC)$/, '')
    .replace(/^SELECT \* FROM products/, 'SELECT COUNT(*) AS n FROM products');

  const countRow = await db.prepare(countSql).get(...params);
  const total = countRow?.n || 0;
  const offset = (page - 1) * limit;

  const rows = await db.prepare(`${sql} LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({
    data: rows.map(productView),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}));

app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const p = await db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id));
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(productView(p));
}));

app.get('/api/products/:id/reviews', asyncRoute(async (req, res) => {
  const reviews = await db.prepare(
    'SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE product_id=? ORDER BY r.created_at DESC'
  ).all(Number(req.params.id));
  res.json(reviews);
}));

app.post('/api/products/:id/reviews', auth, validate(z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).default('')
})), asyncRoute(async (req, res) => {
  const productId = Number(req.params.id);
  try {
    await db.prepare('INSERT INTO reviews(user_id,product_id,rating,comment) VALUES(?,?,?,?)').run(
      req.auth.sub,
      productId,
      req.body.rating,
      req.body.comment
    );
    await db.prepare(
      'UPDATE products SET rating=(SELECT AVG(rating) FROM reviews WHERE product_id=?), reviews_count=(SELECT COUNT(*) FROM reviews WHERE product_id=?) WHERE id=?'
    ).run(productId, productId, productId);
    res.status(201).json({ message: 'Review added' });
  } catch (e) {
    res.status(409).json({ error: 'You have already reviewed this product' });
  }
}));

async function cart(userId) {
  return await db.prepare(
    'SELECT c.product_id as id, c.quantity, p.name, p.price, p.image, p.stock FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=?'
  ).all(userId);
}

app.get('/api/cart', auth, asyncRoute(async (req, res) => {
  res.json({ items: await cart(req.auth.sub) });
}));

app.put('/api/cart/:productId', auth, validate(z.object({
  quantity: z.number().int().min(1).max(99)
})), asyncRoute(async (req, res) => {
  const productId = Number(req.params.productId);
  const p = await db.prepare('SELECT id, stock FROM products WHERE id=?').get(productId);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  if (req.body.quantity > p.stock) return res.status(409).json({ error: 'Not enough stock' });
  await db.prepare(
    'INSERT INTO cart_items(user_id,product_id,quantity) VALUES(?,?,?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)'
  ).run(req.auth.sub, p.id, req.body.quantity);
  res.json({ items: await cart(req.auth.sub) });
}));

app.delete('/api/cart/:productId', auth, asyncRoute(async (req, res) => {
  await db.prepare('DELETE FROM cart_items WHERE user_id=? AND product_id=?').run(
    req.auth.sub,
    Number(req.params.productId)
  );
  res.json({ items: await cart(req.auth.sub) });
}));

app.get('/api/wishlist', auth, asyncRoute(async (req, res) => {
  const rows = await db.prepare(
    'SELECT p.* FROM wishlists w JOIN products p ON p.id=w.product_id WHERE w.user_id=?'
  ).all(req.auth.sub);
  res.json(rows.map(productView));
}));

app.put('/api/wishlist/:productId', auth, asyncRoute(async (req, res) => {
  await db.prepare('INSERT IGNORE INTO wishlists(user_id,product_id) VALUES(?,?)').run(
    req.auth.sub,
    Number(req.params.productId)
  );
  res.status(201).json({ message: 'Added to wishlist' });
}));

app.delete('/api/wishlist/:productId', auth, asyncRoute(async (req, res) => {
  await db.prepare('DELETE FROM wishlists WHERE user_id=? AND product_id=?').run(
    req.auth.sub,
    Number(req.params.productId)
  );
  res.status(204).end();
}));

const orderSchema = z.object({
  shippingAddress: z.string().trim().min(10).max(500),
  paymentMethod: z.enum(['card', 'cash']).default('cash')
});

app.post('/api/orders/checkout', auth, validate(orderSchema), asyncRoute(async (req, res) => {
  const items = await cart(req.auth.sub);
  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
  if (items.some(i => i.quantity > i.stock)) return res.status(409).json({ error: 'One or more items are out of stock' });

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0) + 40;

  const result = await db.transaction(async (txDb) => {
    const o = await txDb.prepare(
      'INSERT INTO orders(user_id,total,shipping_address,payment_status) VALUES(?,?,?,?)'
    ).run(
      req.auth.sub,
      total,
      req.body.shippingAddress,
      req.body.paymentMethod === 'card' ? 'requires_payment' : 'pending'
    );

    for (const i of items) {
      await txDb.prepare('INSERT INTO order_items(order_id,product_id,name,price,quantity) VALUES(?,?,?,?,?)').run(
        o.lastInsertRowid,
        i.id,
        i.name,
        i.price,
        i.quantity
      );
      await txDb.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(i.quantity, i.id);
    }

    await txDb.prepare('DELETE FROM cart_items WHERE user_id=?').run(req.auth.sub);
    const createdOrder = await txDb.prepare('SELECT * FROM orders WHERE id=?').get(o.lastInsertRowid);
    return await orderView(createdOrder, txDb);
  });

  res.status(201).json(result);
}));

app.get('/api/orders', auth, asyncRoute(async (req, res) => {
  const orders = await db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.auth.sub);
  const views = await Promise.all(orders.map(o => orderView(o)));
  res.json(views);
}));

app.get('/api/orders/:id', auth, asyncRoute(async (req, res) => {
  const o = await db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(
    Number(req.params.id),
    req.auth.sub
  );
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json(await orderView(o));
}));

app.get('/api/admin/stats', auth, admin, asyncRoute(async (req, res) => {
  const users = (await db.prepare('SELECT COUNT(*) n FROM users').get())?.n || 0;
  const products = (await db.prepare('SELECT COUNT(*) n FROM products').get())?.n || 0;
  const orders = (await db.prepare('SELECT COUNT(*) n FROM orders').get())?.n || 0;
  const rev = (await db.prepare("SELECT COALESCE(SUM(total),0) total FROM orders WHERE payment_status='paid'").get())?.total || 0;
  res.json({ users, products, orders, revenue: rev });
}));

app.post('/api/admin/products', auth, admin, validate(productSchema), asyncRoute(async (req, res) => {
  const p = req.body;
  const r = await db.prepare(
    'INSERT INTO products(name,description,category,price,old_price,image,brand,sku,stock) VALUES(@name,@description,@category,@price,@oldPrice,@image,@brand,@sku,@stock)'
  ).run({
    ...p,
    oldPrice: p.oldPrice ?? null,
    image: p.image ?? null,
    sku: p.sku ?? null
  });
  const created = await db.prepare('SELECT * FROM products WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json(productView(created));
}));

app.patch('/api/admin/orders/:id', auth, admin, validate(z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  paymentStatus: z.enum(['pending', 'requires_payment', 'paid', 'failed']).optional()
})), asyncRoute(async (req, res) => {
  const orderId = Number(req.params.id);
  await db.prepare('UPDATE orders SET status=?, payment_status=COALESCE(?, payment_status) WHERE id=?').run(
    req.body.status,
    req.body.paymentStatus || null,
    orderId
  );
  const updated = await db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
  res.json(await orderView(updated));
}));

app.get('/api/docs', (req, res) => res.json({
  openapi: '3.0.3',
  info: { title: 'Urban Cart API', version: '1.0.0' },
  servers: [{ url: '/api' }],
  paths: {
    '/auth/register': { post: {} },
    '/auth/login': { post: {} },
    '/products': { get: {} },
    '/cart': { get: {} },
    '/orders/checkout': { post: {} },
    '/admin/stats': { get: {} }
  }
}));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initDb();

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const existing = await db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (!existing) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')").run(
        process.env.ADMIN_NAME || 'Urban Cart Admin',
        email,
        hash
      );
      console.log(`Admin user created: ${email}`);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Urban Cart API listening on http://localhost:${PORT}`);
    console.log(`Connected to Laragon MySQL (database: urban_cart)`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
