
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

import {
    db,
    initDb,
    publicUser,
    productView,
    orderView,
    createDatabaseRequestMiddleware,
    withDatabasePool
} from './db.js';

const app = express();
app.set('trust proxy', 1);

const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET.length < 32)) {
    throw new Error('A JWT_SECRET of at least 32 characters is required in production.');
}

if (!JWT_SECRET) {
    console.warn('Using a development-only JWT secret. Set JWT_SECRET before deployment.');
}

const tokenSecret = JWT_SECRET || 'local-development-secret-change-this';
// Validation schemas
const registerSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128)
});

const loginSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(128)
});

const productSchema = z.object({
    name: z.string().trim().min(2).max(200),
    description: z.string().trim().min(5).max(5000),
    category: z.string().trim().min(2).max(100),
    price: z.number().positive(),
    oldPrice: z.number().positive().optional(),
    image: z.string().url().optional(),
    brand: z.string().trim().min(1).max(100),
    sku: z.string().trim().max(100).optional(),
    stock: z.number().int().min(0)
});

// Middleware helpers
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: result.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        req.body = result.data;
        next();
    };
}

function asyncRoute(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

function getId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function sign(user) {
    return jwt.sign(
        { sub: user.id, role: user.role },
        tokenSecret,
        { expiresIn: '7d' }
    );
}

function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        req.auth = jwt.verify(token, tokenSecret);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function admin(req, res, next) {
    if (req.auth?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' }
}));

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
});
app.use(globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again later.' }
});

// Initialize Neon once, then wait for it before handling API requests.
// Initialize Neon and create the initial admin account.
const databaseReady = (async () => {
    await initDb();

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.warn(
            'ADMIN_EMAIL or ADMIN_PASSWORD is not configured. No admin account was created.'
        );
        return;
    }

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (password.length < 12) {
        throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    }

    await withDatabasePool(async () => {
        const existing = await db.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

       const passwordHash = await bcrypt.hash(password, 12);

if (existing.rowCount === 0) {
    await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')`,
        [
            process.env.ADMIN_NAME || 'Urban Cart Admin',
            email,
            passwordHash
        ]
    );
} else {
    await db.query(
        `UPDATE users
         SET name = $1,
             password_hash = $2,
             role = 'admin'
         WHERE email = $3`,
        [
            process.env.ADMIN_NAME || 'Urban Cart Admin',
            passwordHash,
            email
        ]
    );
}

console.log('Admin account configured.');
    });
})();

// Attach a separate Neon pool to every incoming request.
app.use(createDatabaseRequestMiddleware);

// Wait for database initialization before handling normal API requests.
app.use(async (req, res, next) => {
    if (req.path === '/api/health') {
        return next();
    }

    try {
        await databaseReady;
        next();
    } catch (error) {
        console.error('Database initialization failed:', error);
        res.status(503).json({ error: 'Database is not available.' });
    }
});

// Health
// Health
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT 1 AS ok');

        if (Number(result.rows[0]?.ok) !== 1) {
            throw new Error('Database health check failed.');
        }

        res.json({
            status: 'ok',
            service: 'urban-cart-api',
            database: 'connected',
            time: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check database failure:', error);

        res.status(503).json({
            status: 'error',
            service: 'urban-cart-api',
            database: 'unavailable'
        });
    }
});

// Authentication
app.post('/api/auth/register', authLimiter, validate(registerSchema), asyncRoute(async (req, res) => {
    const name = req.body.name;
    const email = req.body.email.toLowerCase();
    const passwordHash = await bcrypt.hash(req.body.password, 12);

    try {
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, email, passwordHash]
        );

        const user = result.rows[0];

        res.status(201).json({
            user: publicUser(user),
            token: sign(user)
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email is already registered' });
        }
        throw error;
    }
}));

app.post('/api/auth/login', authLimiter, validate(loginSchema), asyncRoute(async (req, res) => {
    const email = req.body.email.toLowerCase();

    const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
        user: publicUser(user),
        token: sign(user)
    });
}));

// Password reset request (generates a one-time token)
app.post('/api/auth/password-reset/request', authLimiter, validate(z.object({
    email: z.string().trim().email().max(255)
})), asyncRoute(async (req, res) => {
    const email = req.body.email.toLowerCase();

    const result = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
    );

    // Always return success to prevent email enumeration
    if (!result.rows[0]) {
        return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
        `INSERT INTO password_resets (user_id, token, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
        [result.rows[0].id, token, expiresAt]
    );

    // In production, send email via your mail provider. For now, log only in dev.
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Password reset token for ${email}: ${token}`);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
}));

// Password reset confirmation
app.post('/api/auth/password-reset/confirm', authLimiter, validate(z.object({
    token: z.string().trim().min(1),
    password: z.string().min(8).max(128)
})), asyncRoute(async (req, res) => {
    const { token, password } = req.body;

    const result = await db.query(
        `SELECT * FROM password_resets
         WHERE token = $1 AND expires_at > NOW()`,
        [token]
    );

    const reset = result.rows[0];

    if (!reset) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, reset.user_id]
    );

    await db.query(
        'DELETE FROM password_resets WHERE user_id = $1',
        [reset.user_id]
    );

    res.json({ message: 'Password has been reset. You can now sign in.' });
}));

app.get('/api/auth/me', auth, asyncRoute(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [req.auth.sub]
    );

    if (!result.rows[0]) {
        return res.status(401).json({ error: 'User no longer exists' });
    }

    res.json({ user: publicUser(result.rows[0]) });
}));

// Profile update (self-service; customers can only update their own profile)
app.put('/api/profile', auth, validate(z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().max(20).optional().default(''),
    city: z.string().trim().max(100).optional().default(''),
    address: z.string().trim().max(500).optional().default('')
})), asyncRoute(async (req, res) => {
    const result = await db.query(
        `UPDATE users
         SET name = $1
         WHERE id = $2
         RETURNING *`,
        [req.body.name, req.auth.sub]
    );

    if (!result.rows[0]) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: publicUser(result.rows[0]) });
}));

// Categories
app.get('/api/categories', asyncRoute(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM categories ORDER BY name'
    );

    res.json(result.rows);
}));

// Products
app.get('/api/products', asyncRoute(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const sort = String(req.query.sort || 'newest');

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (q) {
        params.push(`%${q}%`);
        const searchIndex = params.length;
        conditions.push(
            `(name ILIKE $${searchIndex} OR description ILIKE $${searchIndex} OR brand ILIKE $${searchIndex})`
        );
    }

    if (category) {
        params.push(category);
        conditions.push(`category = $${params.length}`);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const sortOptions = {
        price_asc: 'price ASC',
        price_desc: 'price DESC',
        rating: 'rating DESC',
        newest: 'created_at DESC',
        name: 'name ASC'
    };

    const orderBy = sortOptions[sort] || 'created_at DESC';

    const countResult = await db.query(
        `SELECT COUNT(*)::int AS total FROM products ${where}`,
        params
    );

    const result = await db.query(
        `SELECT * FROM products
         ${where}
         ORDER BY ${orderBy}
         LIMIT $${params.length + 1}
         OFFSET $${params.length + 2}`,
        [...params, limit, offset]
    );

    const total = countResult.rows[0].total;

    res.json({
        data: result.rows.map(productView),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}));

app.get('/api/products/:id', asyncRoute(async (req, res) => {
    const productId = getId(req.params.id);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    const result = await db.query(
        'SELECT * FROM products WHERE id = $1',
        [productId]
    );

    if (!result.rows[0]) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.json(productView(result.rows[0]));
}));

app.get('/api/products/:id/reviews', asyncRoute(async (req, res) => {
    const productId = getId(req.params.id);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    const result = await db.query(
        `SELECT r.*, u.name AS user_name
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC`,
        [productId]
    );

    res.json(result.rows);
}));

app.post('/api/products/:id/reviews', auth, validate(z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).default('')
})), asyncRoute(async (req, res) => {
    const productId = getId(req.params.id);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
        await db.query(
            `INSERT INTO reviews (user_id, product_id, rating, comment)
             VALUES ($1, $2, $3, $4)`,
            [req.auth.sub, productId, req.body.rating, req.body.comment]
        );

        await db.query(
            `UPDATE products
             SET rating = (
                 SELECT COALESCE(AVG(rating), 0)
                 FROM reviews WHERE product_id = $1
             ),
             reviews_count = (
                 SELECT COUNT(*) FROM reviews WHERE product_id = $1
             )
             WHERE id = $1`,
            [productId]
        );

        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'You have already reviewed this product'
            });
        }

        if (error.code === '23503') {
            return res.status(404).json({ error: 'Product not found' });
        }

        throw error;
    }
}));

// Cart
async function getCart(userId, client = db) {
    const result = await client.query(
        `SELECT
            c.product_id AS id,
            c.quantity,
            p.name,
            p.price,
            p.image,
            p.stock
         FROM cart_items c
         JOIN products p ON p.id = c.product_id
         WHERE c.user_id = $1
         ORDER BY p.name`,
        [userId]
    );

    return result.rows;
}

app.get('/api/cart', auth, asyncRoute(async (req, res) => {
    res.json({ items: await getCart(req.auth.sub) });
}));

app.put('/api/cart/:productId', auth, validate(z.object({
    quantity: z.number().int().min(1).max(99)
})), asyncRoute(async (req, res) => {
    const productId = getId(req.params.productId);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    const result = await db.query(
        'SELECT id, stock FROM products WHERE id = $1',
        [productId]
    );

    const product = result.rows[0];

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (req.body.quantity > product.stock) {
        return res.status(409).json({ error: 'Not enough stock' });
    }

    await db.query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = EXCLUDED.quantity`,
        [req.auth.sub, productId, req.body.quantity]
    );

    res.json({ items: await getCart(req.auth.sub) });
}));

app.delete('/api/cart/:productId', auth, asyncRoute(async (req, res) => {
    const productId = getId(req.params.productId);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    await db.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [req.auth.sub, productId]
    );

    res.json({ items: await getCart(req.auth.sub) });
}));

// Wishlist
app.get('/api/wishlist', auth, asyncRoute(async (req, res) => {
    const result = await db.query(
        `SELECT p.*
         FROM wishlists w
         JOIN products p ON p.id = w.product_id
         WHERE w.user_id = $1
         ORDER BY p.name`,
        [req.auth.sub]
    );

    res.json(result.rows.map(productView));
}));

app.put('/api/wishlist/:productId', auth, asyncRoute(async (req, res) => {
    const productId = getId(req.params.productId);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    const result = await db.query(
        'SELECT id FROM products WHERE id = $1',
        [productId]
    );

    if (!result.rows[0]) {
        return res.status(404).json({ error: 'Product not found' });
    }

    await db.query(
        `INSERT INTO wishlists (user_id, product_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [req.auth.sub, productId]
    );

    res.status(201).json({ message: 'Added to wishlist' });
}));

app.delete('/api/wishlist/:productId', auth, asyncRoute(async (req, res) => {
    const productId = getId(req.params.productId);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    await db.query(
        'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
        [req.auth.sub, productId]
    );

    res.status(204).end();
}));

// Orders
const orderSchema = z.object({
    shippingAddress: z.string().trim().min(10).max(500),
    paymentMethod: z.enum(['card', 'cash']).default('cash')
});

app.post('/api/orders/checkout', auth, validate(orderSchema), asyncRoute(async (req, res) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const cartResult = await client.query(
            `SELECT
                c.product_id AS id,
                c.quantity,
                p.name,
                p.price,
                p.stock
             FROM cart_items c
             JOIN products p ON p.id = c.product_id
             WHERE c.user_id = $1
             FOR UPDATE OF p`,
            [req.auth.sub]
        );

        const items = cartResult.rows;

        if (!items.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cart is empty' });
        }

        if (items.some(item => item.quantity > item.stock)) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'One or more items are out of stock'
            });
        }

        const total = items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0
        ) + 40;

        const paymentStatus = req.body.paymentMethod === 'card'
            ? 'requires_payment'
            : 'pending';

        const orderResult = await client.query(
            `INSERT INTO orders (user_id, total, shipping_address, payment_status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.auth.sub, total, req.body.shippingAddress, paymentStatus]
        );

        const order = orderResult.rows[0];

        for (const item of items) {
            await client.query(
                `INSERT INTO order_items
                 (order_id, product_id, name, price, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [order.id, item.id, item.name, item.price, item.quantity]
            );

            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.id]
            );
        }

        await client.query(
            'DELETE FROM cart_items WHERE user_id = $1',
            [req.auth.sub]
        );

        await client.query('COMMIT');

        res.status(201).json(await orderView(order));
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}));

app.get('/api/orders', auth, asyncRoute(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [req.auth.sub]
    );

    const orders = await Promise.all(
        result.rows.map(orderView)
    );

    res.json(orders);
}));

app.get('/api/orders/:id', auth, asyncRoute(async (req, res) => {
    const orderId = getId(req.params.id);

    if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
    }

    const result = await db.query(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, req.auth.sub]
    );

    if (!result.rows[0]) {
        return res.status(404).json({ error: 'Order not found' });
    }

    res.json(await orderView(result.rows[0]));
}));

// Admin
app.get('/api/admin/stats', auth, admin, asyncRoute(async (req, res) => {
    const [users, products, orders, revenue] = await Promise.all([
        db.query('SELECT COUNT(*)::int AS count FROM users'),
        db.query('SELECT COUNT(*)::int AS count FROM products'),
        db.query('SELECT COUNT(*)::int AS count FROM orders'),
        db.query(
            `SELECT COALESCE(SUM(total), 0) AS total
             FROM orders WHERE payment_status = 'paid'`
        )
    ]);

    res.json({
        users: users.rows[0].count,
        products: products.rows[0].count,
        orders: orders.rows[0].count,
        revenue: Number(revenue.rows[0].total)
    });
}));

app.get('/api/admin/orders', auth, admin, asyncRoute(async (req, res) => {
    const result = await db.query(
        `SELECT *
         FROM orders
         ORDER BY created_at DESC
         LIMIT 100`
    );

    const orders = await Promise.all(
        result.rows.map(order => orderView(order))
    );

    res.json({ orders });
}));

app.post('/api/admin/products', auth, admin, validate(productSchema), asyncRoute(async (req, res) => {
    const product = req.body;

    const result = await db.query(
        `INSERT INTO products (
            name, description, category, price, old_price,
            image, brand, sku, stock
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
            product.name,
            product.description,
            product.category,
            product.price,
            product.oldPrice ?? null,
            product.image ?? null,
            product.brand,
            product.sku ?? null,
            product.stock
        ]
    );

    res.status(201).json(productView(result.rows[0]));
}));

app.get('/api/admin/products', auth, admin, asyncRoute(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM products ORDER BY created_at DESC LIMIT 200'
    );

    res.json(result.rows.map(productView));
}));

app.put('/api/admin/products/:id', auth, admin, validate(productSchema), asyncRoute(async (req, res) => {
    const productId = getId(req.params.id);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = req.body;

    const result = await db.query(
        `UPDATE products
         SET name = $1,
             description = $2,
             category = $3,
             price = $4,
             old_price = $5,
             image = $6,
             brand = $7,
             sku = $8,
             stock = $9
         WHERE id = $10
         RETURNING *`,
        [
            product.name,
            product.description,
            product.category,
            product.price,
            product.oldPrice ?? null,
            product.image ?? null,
            product.brand,
            product.sku ?? null,
            product.stock,
            productId
        ]
    );

    if (!result.rows[0]) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.json(productView(result.rows[0]));
}));

app.delete('/api/admin/products/:id', auth, admin, asyncRoute(async (req, res) => {
    const productId = getId(req.params.id);

    if (!productId) {
        return res.status(400).json({ error: 'Invalid product ID' });
    }

    const result = await db.query(
        'DELETE FROM products WHERE id = $1 RETURNING id',
        [productId]
    );

    if (!result.rows[0]) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).end();
}));

app.patch('/api/admin/orders/:id', auth, admin, validate(z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    paymentStatus: z.enum(['pending', 'requires_payment', 'paid', 'failed']).optional()
})), asyncRoute(async (req, res) => {
    const orderId = getId(req.params.id);

    if (!orderId) {
        return res.status(400).json({ error: 'Invalid order ID' });
    }

    const result = await db.query(
        `UPDATE orders
         SET status = $1,
             payment_status = COALESCE($2, payment_status)
         WHERE id = $3
         RETURNING *`,
        [req.body.status, req.body.paymentStatus || null, orderId]
    );

    if (!result.rows[0]) {
        return res.status(404).json({ error: 'Order not found' });
    }

    res.json(await orderView(result.rows[0]));
}));

// API documentation
app.get('/api/docs', (req, res) => {
    res.json({
        openapi: '3.0.3',
        info: {
            title: 'Urban Cart API',
            version: '1.0.0'
        },
        servers: [{ url: '/api' }],
        paths: {
            '/auth/register': { post: {} },
            '/auth/login': { post: {} },
            '/products': { get: {} },
            '/cart': { get: {} },
            '/orders/checkout': { post: {} },
            '/admin/stats': { get: {} }
        }
    });
});

// Not found
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('API error:', error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        error: 'Internal server error'
    });
});

export default app;

// Local development server. Vercel imports the app without starting a listener.
const isMainFile = process.argv[1] &&
    fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]));

if (isMainFile && process.env.VERCEL !== '1') {
    const port = Number(process.env.PORT || 3000);

    databaseReady.then(() => {
        app.listen(port, '0.0.0.0', () => {
            console.log(`Urban Cart API listening on port ${port}`);
        });
    }).catch(error => {
        console.error('Could not start Urban Cart API:', error);
        process.exitCode = 1;
    });
}
