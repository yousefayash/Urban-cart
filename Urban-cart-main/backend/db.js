import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'urban_cart',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
};

let pool = null;

function normalizeSqlAndParams(sql, params = []) {
  let cleanSql = sql
    .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT IGNORE INTO')
    .replace(/COLLATE\s+NOCASE/gi, '')
    .replace(/ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*UPDATE\s*SET\s*quantity\s*=\s*excluded\.quantity/gi, 'ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)');

  if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
    const obj = params[0];
    const extracted = [];
    cleanSql = cleanSql.replace(/@([a-zA-Z0-9_]+)/g, (_, key) => {
      extracted.push(obj[key] !== undefined ? obj[key] : null);
      return '?';
    });
    return { sql: cleanSql, params: extracted };
  }

  const flatParams = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
  return { sql: cleanSql, params: flatParams };
}

async function getPool() {
  if (!pool) {
    try {
      const initConn = await mysql.createConnection({
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password
      });
      await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await initConn.end();
    } catch (e) {
      console.warn('Could not auto-create database (might already exist or permission limited):', e.message);
    }

    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

export const db = {
  async query(sql, ...params) {
    const p = await getPool();
    const norm = normalizeSqlAndParams(sql, params);
    const [result] = await p.query(norm.sql, norm.params);
    return result;
  },

  async get(sql, ...params) {
    const p = await getPool();
    const norm = normalizeSqlAndParams(sql, params);
    const [rows] = await p.query(norm.sql, norm.params);
    return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
  },

  async all(sql, ...params) {
    const p = await getPool();
    const norm = normalizeSqlAndParams(sql, params);
    const [rows] = await p.query(norm.sql, norm.params);
    return Array.isArray(rows) ? rows : [];
  },

  async run(sql, ...params) {
    const p = await getPool();
    const norm = normalizeSqlAndParams(sql, params);
    const [result] = await p.query(norm.sql, norm.params);
    return {
      lastInsertRowid: result.insertId,
      changes: result.affectedRows
    };
  },

  prepare(sql) {
    return {
      get: (...params) => this.get(sql, ...params),
      all: (...params) => this.all(sql, ...params),
      run: (...params) => this.run(sql, ...params)
    };
  },

  async transaction(fn) {
    const p = await getPool();
    const conn = await p.getConnection();
    try {
      await conn.beginTransaction();

      const txDb = {
        async get(sql, ...params) {
          const norm = normalizeSqlAndParams(sql, params);
          const [rows] = await conn.query(norm.sql, norm.params);
          return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
        },
        async all(sql, ...params) {
          const norm = normalizeSqlAndParams(sql, params);
          const [rows] = await conn.query(norm.sql, norm.params);
          return Array.isArray(rows) ? rows : [];
        },
        async run(sql, ...params) {
          const norm = normalizeSqlAndParams(sql, params);
          const [result] = await conn.query(norm.sql, norm.params);
          return {
            lastInsertRowid: result.insertId,
            changes: result.affectedRows
          };
        },
        prepare(sql) {
          return {
            get: (...params) => this.get(sql, ...params),
            all: (...params) => this.all(sql, ...params),
            run: (...params) => this.run(sql, ...params)
          };
        }
      };

      const result = await fn(txDb);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}

export function productView(p) {
  if (!p) return null;
  return {
    ...p,
    oldPrice: p.old_price,
    reviews: p.reviews_count
  };
}

export async function orderView(order, customDb = db) {
  if (!order) return null;
  const items = await customDb.all(
    'SELECT product_id as id, name, price, quantity FROM order_items WHERE order_id = ?',
    [order.id]
  );
  return {
    ...order,
    shippingAddress: order.shipping_address,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    items
  };
}

export async function initDb() {
  const p = await getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      slug VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      old_price DECIMAL(10, 2) NULL,
      image TEXT,
      brand VARCHAR(255),
      sku VARCHAR(255) UNIQUE,
      stock INT NOT NULL DEFAULT 0,
      rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
      reviews_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      PRIMARY KEY(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      PRIMARY KEY(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      total DECIMAL(10, 2) NOT NULL,
      shipping_address TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity INT NOT NULL,
      PRIMARY KEY(order_id, product_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      rating INT NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_product (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await seedCatalog();
}

export async function seedCatalog() {
  const row = await db.get('SELECT COUNT(*) AS n FROM products');
  if (row && row.n > 0) return;

  const dataPath = path.resolve(process.cwd(), 'data.js');
  if (!fs.existsSync(dataPath)) return;

  const file = fs.readFileSync(dataPath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(file, sandbox);
  } catch (e) {
    console.error('Failed to evaluate data.js:', e.message);
    return;
  }

  const products = sandbox.window.PRODUCTS || [];
  if (!products.length) return;

  console.log(`Seeding ${products.length} products to Laragon MySQL...`);
  for (const p of products) {
    const slug = (p.category || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await db.run('INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)', p.category, slug);
    await db.run(
      `INSERT IGNORE INTO products (id, name, description, category, price, old_price, image, brand, sku, stock, rating, reviews_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      p.id,
      p.name,
      p.description || '',
      p.category,
      p.price,
      p.oldPrice ?? null,
      p.image || null,
      p.brand || '',
      p.sku || null,
      p.stock === 'In Stock' ? 25 : 0,
      p.rating || 0,
      p.reviews || 0
    );
  }
  console.log('Seeding complete.');
}
