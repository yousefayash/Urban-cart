
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

import {
    db,
    initDb,
    publicUser,
    productView,
    orderView
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

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(helmet());

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json({ limit: '100kb' }));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
}));

// Initialize Neon once, then wait for it before handling API requests.
const databaseReady = initDb().then(async () => {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is not configured. No admin account was created.');
        return;
    }

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (password.length < 12) {
        throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    }

    const existing = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
    );

    if (existing.rowCount === 0) {
        const passwordHash = await bcrypt.hash(password, 12);

        await db.query(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'admin')`,
            [process.env.ADMIN_NAME || 'Urban Cart Admin', email, passwordHash]
        );

        console.log('Initial admin account created.');
    }
});

app.use(async (req, res, next) => {
    try {
        await databaseReady;
        next();
    } catch (error) {
        console.error('Database initialization failed:', error);
        res.status(503).json({ error: 'Database is not available.' });
    }
});

const asyncRoute = handler => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

const validate = (schema, source = 'body') => (req, res, next) => {
    const parsed = schema.safeParse(req[source]);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: parsed.error.flatten()
        });
    }

    req[source] = parsed.data;
    next();
};

const sign = user => jwt.sign(
    { sub: user.id, role: user.role },
    tokenSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        req.auth = jwt.verify(match[1], tokenSecret);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

const admin = asyncRoute(async (req, res, next) => {
    const result = await db.query(
        'SELECT role FROM users WHERE id = $1',
        [req.auth.sub]
    );

    if (!result.rows[0] || result.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
});

const registerSchema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    password: z.string().min(8).max(128)
});

const loginSchema = z.object({
    email: z.string().trim().email().max(160),
    password: z.string().min(1).max(128)
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

const idSchema = z.coerce.number().int().positive();

function getId(value) {
    const parsed = idSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
}

// Health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'urban-cart-api',
        database: 'postgresql',
        time: new Date().toISOString()
    });
});

// Authentication
app.post('/api/auth/register', validate(registerSchema), asyncRoute(async (req, res) => {
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

app.post('/api/auth/login', validate(loginSchema), asyncRoute(async (req, res) => {
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
