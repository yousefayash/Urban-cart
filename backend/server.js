import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    z
} from 'zod';
import {
    db,
    publicUser,
    productView,
    orderView
} from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-me';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'development-only-change-me') throw new Error('JWT_SECRET must be set in production');
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
    if (!existing) db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')").run(process.env.ADMIN_NAME || 'Urban Cart Admin', email, await bcrypt.hash(process.env.ADMIN_PASSWORD, 12));
}
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : true,
    credentials: true
}));
app.use(express.json({
    limit: '100kb'
}));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true
}));
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validate = (schema, source = 'body') => (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten()
    });
    req[source] = parsed.data;
    next();
};
const sign = user => jwt.sign({
    sub: user.id,
    role: user.role
}, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

function auth(req, res, next) {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (!token) return res.status(401).json({
        error: 'Authentication required'
    });
    try {
        req.auth = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
}
const admin = (req, res, next) => req.auth?.role === 'admin' ? next() : res.status(403).json({
    error: 'Admin access required'
});
const id = z.coerce.number().int().positive();
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
    time: new Date().toISOString()
}));
app.post('/api/auth/register', validate(registerSchema), asyncRoute(async (req, res) => {
    const {
        name,
        email,
        password
    } = req.body;
    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (exists) return res.status(409).json({
        error: 'Email is already registered'
    });
    const user = {
        name,
        email,
        password_hash: await bcrypt.hash(password, 12)
    };
    const result = db.prepare('INSERT INTO users(name,email,password_hash) VALUES (@name,@email,@password_hash)').run(user);
    const created = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json({
        user: publicUser(created),
        token: sign(created)
    });
}));
app.post('/api/auth/login', validate(loginSchema), asyncRoute(async (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(req.body.email);
    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) return res.status(401).json({
        error: 'Invalid email or password'
    });
    res.json({
        user: publicUser(user),
        token: sign(user)
    });
}));
app.get('/api/auth/me', auth, (req, res) => res.json({
    user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.auth.sub))
}));
app.get('/api/categories', (req, res) => res.json(db.prepare('SELECT * FROM categories ORDER BY name').all()));
app.get('/api/products', (req, res) => {
    const q = String(req.query.q || '').trim(),
        category = String(req.query.category || ''),
        sort = String(req.query.sort || 'newest');
    let sql = 'SELECT * FROM products WHERE 1=1',
        params = [];
    if (q) {
        sql += ' AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)';
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (category) {
        sql += ' AND category=?';
        params.push(category);
    }
    sql += ({
        price_asc: ' ORDER BY price ASC',
        price_desc: ' ORDER BY price DESC',
        rating: ' ORDER BY rating DESC',
        newest: ' ORDER BY created_at DESC'
    } [sort] || ' ORDER BY name ASC');
    const page = Math.max(1, Number(req.query.page) || 1),
        limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const countSql = sql.replace(/ ORDER BY (price ASC|price DESC|rating DESC|created_at DESC|name ASC)$/, '').replace(/^SELECT \* FROM products/, 'SELECT COUNT(*) AS n FROM products');
    const total = db.prepare(countSql).get(...params)?.n || 0;
    const rows = db.prepare(`${sql} LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit).map(productView);
    res.json({
        data: rows,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});
app.get('/api/products/:id', (req, res) => {
    const p = db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id));
    if (!p) return res.status(404).json({
        error: 'Product not found'
    });
    res.json(productView(p));
});
app.get('/api/products/:id/reviews', (req, res) => res.json(db.prepare('SELECT r.*,u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE product_id=? ORDER BY r.created_at DESC').all(Number(req.params.id))));
app.post('/api/products/:id/reviews', auth, validate(z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).default('')
})), (req, res) => {
    try {
        db.prepare('INSERT INTO reviews(user_id,product_id,rating,comment) VALUES(?,?,?,?)').run(req.auth.sub, Number(req.params.id), req.body.rating, req.body.comment);
        db.prepare('UPDATE products SET rating=(SELECT AVG(rating) FROM reviews WHERE product_id=?),reviews_count=(SELECT COUNT(*) FROM reviews WHERE product_id=?) WHERE id=?').run(Number(req.params.id), Number(req.params.id), Number(req.params.id));
        res.status(201).json({
            message: 'Review added'
        });
    } catch (e) {
        res.status(409).json({
            error: 'You have already reviewed this product'
        })
    }
});

function cart(req) {
    return db.prepare('SELECT c.product_id as id,c.quantity,p.name,p.price,p.image,p.stock FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=?').all(req.auth.sub);
}
app.get('/api/cart', auth, (req, res) => res.json({
    items: cart(req)
}));
app.put('/api/cart/:productId', auth, validate(z.object({
    quantity: z.number().int().min(1).max(99)
})), (req, res) => {
    const p = db.prepare('SELECT id,stock FROM products WHERE id=?').get(Number(req.params.productId));
    if (!p) return res.status(404).json({
        error: 'Product not found'
    });
    if (req.body.quantity > p.stock) return res.status(409).json({
        error: 'Not enough stock'
    });
    db.prepare('INSERT INTO cart_items(user_id,product_id,quantity) VALUES(?,?,?) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=excluded.quantity').run(req.auth.sub, p.id, req.body.quantity);
    res.json({
        items: cart(req)
    });
});
app.delete('/api/cart/:productId', auth, (req, res) => {
    db.prepare('DELETE FROM cart_items WHERE user_id=? AND product_id=?').run(req.auth.sub, Number(req.params.productId));
    res.json({
        items: cart(req)
    });
});
app.get('/api/wishlist', auth, (req, res) => res.json(db.prepare('SELECT p.* FROM wishlists w JOIN products p ON p.id=w.product_id WHERE w.user_id=?').all(req.auth.sub).map(productView)));
app.put('/api/wishlist/:productId', auth, (req, res) => {
    db.prepare('INSERT OR IGNORE INTO wishlists(user_id,product_id) VALUES(?,?)').run(req.auth.sub, Number(req.params.productId));
    res.status(201).json({
        message: 'Added to wishlist'
    });
});
app.delete('/api/wishlist/:productId', auth, (req, res) => {
    db.prepare('DELETE FROM wishlists WHERE user_id=? AND product_id=?').run(req.auth.sub, Number(req.params.productId));
    res.status(204).end();
});
const orderSchema = z.object({
    shippingAddress: z.string().trim().min(10).max(500),
    paymentMethod: z.enum(['card', 'cash']).default('cash')
});
app.post('/api/orders/checkout', auth, validate(orderSchema), (req, res) => {
    const items = cart(req);
    if (!items.length) return res.status(400).json({
        error: 'Cart is empty'
    });
    if (items.some(i => i.quantity > i.stock)) return res.status(409).json({
        error: 'One or more items are out of stock'
    });
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0) + 40;
    const tx = db.transaction(() => {
        const o = db.prepare('INSERT INTO orders(user_id,total,shipping_address,payment_status) VALUES(?,?,?,?)').run(req.auth.sub, total, req.body.shippingAddress, req.body.paymentMethod === 'card' ? 'requires_payment' : 'pending');
        items.forEach(i => {
            db.prepare('INSERT INTO order_items(order_id,product_id,name,price,quantity) VALUES(?,?,?,?,?)').run(o.lastInsertRowid, i.id, i.name, i.price, i.quantity);
            db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(i.quantity, i.id);
        });
        db.prepare('DELETE FROM cart_items WHERE user_id=?').run(req.auth.sub);
        return db.prepare('SELECT * FROM orders WHERE id=?').get(o.lastInsertRowid);
    });
    res.status(201).json(orderView(tx));
});
app.get('/api/orders', auth, (req, res) => res.json(db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.auth.sub).map(orderView)));
app.get('/api/orders/:id', auth, (req, res) => {
    const o = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(Number(req.params.id), req.auth.sub);
    if (!o) return res.status(404).json({
        error: 'Order not found'
    });
    res.json(orderView(o));
});
app.get('/api/admin/stats', auth, admin, (req, res) => res.json({
    users: db.prepare('SELECT COUNT(*) n FROM users').get().n,
    products: db.prepare('SELECT COUNT(*) n FROM products').get().n,
    orders: db.prepare('SELECT COUNT(*) n FROM orders').get().n,
    revenue: db.prepare("SELECT COALESCE(SUM(total),0) total FROM orders WHERE payment_status='paid'").get().total
}));
app.post('/api/admin/products', auth, admin, validate(productSchema), (req, res) => {
    const p = req.body;
    const r = db.prepare('INSERT INTO products(name,description,category,price,old_price,image,brand,sku,stock) VALUES(@name,@description,@category,@price,@oldPrice,@image,@brand,@sku,@stock)').run({
        ...p,
        oldPrice: p.oldPrice ?? null,
        image: p.image ?? null,
        sku: p.sku ?? null
    });
    res.status(201).json(productView(db.prepare('SELECT * FROM products WHERE id=?').get(r.lastInsertRowid)));
});
app.patch('/api/admin/orders/:id', auth, admin, validate(z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    paymentStatus: z.enum(['pending', 'requires_payment', 'paid', 'failed']).optional()
})), (req, res) => {
    db.prepare('UPDATE orders SET status=?,payment_status=COALESCE(?,payment_status) WHERE id=?').run(req.body.status, req.body.paymentStatus || null, Number(req.params.id));
    res.json(orderView(db.prepare('SELECT * FROM orders WHERE id=?').get(Number(req.params.id))));
});
app.get('/api/docs', (req, res) => res.json({
    openapi: '3.0.3',
    info: {
        title: 'Urban Cart API',
        version: '1.0.0'
    },
    servers: [{
        url: '/api'
    }],
    paths: {
        '/auth/register': {
            post: {}
        },
        '/auth/login': {
            post: {}
        },
        '/products': {
            get: {}
        },
        '/cart': {
            get: {}
        },
        '/orders/checkout': {
            post: {}
        },
        '/admin/stats': {
            get: {}
        }
    }
}));
app.use((req, res) => res.status(404).json({
    error: 'Route not found'
}));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        error: 'Internal server error'
    });
});
app.listen(PORT, '0.0.0.0', () => console.log(`Urban Cart API listening on 0.0.0.0:${PORT}`));
export default app;