import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.env.DATA_DIR || './data');
fs.mkdirSync(dataDir, {
    recursive: true
});
export const db = new Database(process.env.DATABASE_PATH || path.join(dataDir, 'urban-cart.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL, price REAL NOT NULL CHECK(price >= 0), old_price REAL, image TEXT, brand TEXT, sku TEXT UNIQUE, stock INTEGER NOT NULL DEFAULT 0, rating REAL NOT NULL DEFAULT 0, reviews_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS cart_items (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL CHECK(quantity > 0), PRIMARY KEY(user_id, product_id));
CREATE TABLE IF NOT EXISTS wishlists (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER NOT NULL REFERENCES products(id), PRIMARY KEY(user_id, product_id));
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT NOT NULL DEFAULT 'pending', total REAL NOT NULL, shipping_address TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items (order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id INTEGER NOT NULL, name TEXT NOT NULL, price REAL NOT NULL, quantity INTEGER NOT NULL, PRIMARY KEY(order_id, product_id));
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comment TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id));
`);

export function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
    };
}
export function productView(p) {
    return p ? {
        ...p,
        oldPrice: p.old_price,
        reviews: p.reviews_count
    } : p;
}
export function orderView(order) {
    if (!order) return null;
    const items = db.prepare('SELECT product_id as id, name, price, quantity FROM order_items WHERE order_id=?').all(order.id);
    return {
        ...order,
        shippingAddress: order.shipping_address,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
        items
    };
}

export function seedCatalog() {
    const count = db.prepare('SELECT COUNT(*) n FROM products').get().n;
    if (count) return;
    const file = fs.readFileSync(path.resolve('data.js'), 'utf8');
    const source = file.replace(/^.*?const PRODUCTS\s*=\s*/, '').replace(/;\s*$/s, '');
    let products = [];
    try {
        products = Function(`"use strict"; return (${source})`)();
    } catch {
        products = [];
    }
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories(name,slug) VALUES (?,?)');
    const insert = db.prepare('INSERT OR IGNORE INTO products(id,name,description,category,price,old_price,image,brand,sku,stock,rating,reviews_count) VALUES (@id,@name,@description,@category,@price,@oldPrice,@image,@brand,@sku,@stock,@rating,@reviews)');
    const tx = db.transaction(() => products.forEach(p => {
        insertCategory.run(p.category, p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        insert.run({
            ...p,
            oldPrice: p.oldPrice ?? null,
            stock: p.stock === 'In Stock' ? 25 : 0,
            reviews: p.reviews || 0
        });
    }));
    tx();
}
seedCatalog();