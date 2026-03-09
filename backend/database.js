/**
 * 数据库配置 - MySQL 版本
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'bbq2024',
  database: process.env.DB_NAME || 'bbq_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDatabase() {
  const tempConfig = { ...dbConfig };
  delete tempConfig.database;
  
  const tempPool = mysql.createPool(tempConfig);
  
  try {
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✓ 数据库创建成功');
  } finally {
    await tempPool.end();
  }
  
  pool = mysql.createPool(dbConfig);
  await initTables();
  await insertDefaultData();
  
  console.log('✓ 数据库初始化完成');
  console.log('✓ 数据库模块初始化完成');
  return pool;
}

async function initTables() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await pool.execute(stmt.trim());
        } catch (e) {
          if (!e.message.includes('already exists')) {
            // 忽略存储过程/触发器错误
          }
        }
      }
    }
    console.log('✓ 数据库表创建成功');
  }
}

async function insertDefaultData() {
  try {
    const [admins] = await pool.execute('SELECT COUNT(*) as count FROM admins');
    if (admins[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await pool.execute(
        'INSERT INTO admins (username, password, role, status) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'super_admin', 1]
      );
      console.log('✓ 默认管理员创建成功');
    }
    
    const [categories] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    if (categories[0].count === 0) {
      const cats = [
        ['肉类食材', 1], ['海鲜食材', 2], ['蔬菜食材', 3], ['丸子类', 4], ['调料类', 5], ['酒水饮料', 6]
      ];
      for (const cat of cats) {
        await pool.execute('INSERT INTO categories (name, sort, status) VALUES (?, ?, 1)', cat);
      }
      console.log('✓ 默认分类创建成功');
    }
    
    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products');
    if (products[0].count === 0) {
      const prods = [
        [1, '羊肉串', '新鲜羊肉，已腌制，每串约 50g', 599, 799, 500],
        [1, '牛肉串', '优质牛肉，秘制调料腌制', 699, 899, 300],
        [1, '五花肉', '精选猪五花肉，切片装 500g', 2999, 3599, 200],
        [1, '鸡翅中', '冷冻鸡翅中，500g 装', 3499, 3999, 150],
        [2, '烤鱿鱼', '新鲜鱿鱼须，200g 装', 2499, 2999, 100],
        [2, '基围虾', '鲜活基围虾，500g 装', 4999, 5999, 80],
        [3, '土豆片', '新鲜土豆切片，300g 装', 599, 799, 400],
        [3, '韭菜', '新鲜韭菜，200g 装', 399, 499, 300],
        [3, '金针菇', '新鲜金针菇，300g 装', 499, 599, 350],
        [4, '牛肉丸', '手打牛肉丸，250g 装', 1999, 2399, 180],
        [4, '亲亲肠', '台湾烤肠，10 根装', 1799, 2199, 250],
        [5, '烧烤酱', '秘制烧烤酱，200g 装', 1299, 1599, 150],
        [5, '孜然粉', '新疆孜然粉，50g 装', 599, 799, 200],
        [6, '可乐', '可口可乐，330ml*6 罐', 1599, 1899, 300],
        [6, '啤酒', '青岛啤酒，500ml*6 罐', 3999, 4599, 200]
      ];
      for (const p of prods) {
        await pool.execute(
          'INSERT INTO products (category_id, name, description, price, original_price, stock, sales, status, is_hot) VALUES (?, ?, ?, ?, ?, ?, 0, 1, 0)',
          p
        );
      }
      console.log('✓ 默认商品创建成功');
    }
  } catch (error) {
    console.error('初始化数据错误:', error.message);
  }
}

// 导出带 execute 方法的代理对象
const db = {
  execute: async (...args) => {
    if (!pool) {
      throw new Error('数据库未初始化');
    }
    return pool.execute(...args);
  },
  getConnection: async () => {
    if (!pool) {
      throw new Error('数据库未初始化');
    }
    return pool.getConnection();
  }
};

// 初始化并替换
initDatabase().then(p => {
  pool = p;
}).catch(err => {
  console.error('数据库初始化失败:', err);
});

module.exports = db;
