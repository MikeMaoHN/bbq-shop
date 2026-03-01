/**
 * 数据库配置 - SQLite 版本
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/bbq_shop.db');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 初始化数据库表
function initDatabase() {
  const schemaPath = path.join(__dirname, '../../database/schema-sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    // SQLite 需要分条执行 CREATE TABLE 语句
    const statements = schema.split(';').filter(s => s.trim().length > 0);
    for (const stmt of statements) {
      try {
        db.exec(stmt.trim());
      } catch (e) {
        // 忽略已存在的表错误
        if (!e.message.includes('already exists')) {
          console.error('执行 SQL 错误:', e.message);
        }
      }
    }
    console.log('✓ 数据库表创建成功');
  }
  
  // 插入默认数据
  insertDefaultData();
}

function insertDefaultData() {
  try {
    // 检查是否已有管理员
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
    if (adminCount.count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.prepare(`
        INSERT INTO admins (username, password, role, status) 
        VALUES ('admin', ?, 'super_admin', 1)
      `).run(hashedPassword);
      console.log('✓ 默认管理员创建成功 (admin/admin123)');
    }
    
    // 检查是否已有分类
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (categoryCount.count === 0) {
      const categories = [
        ['肉类食材', 1],
        ['海鲜食材', 2],
        ['蔬菜食材', 3],
        ['丸子类', 4],
        ['调料类', 5],
        ['酒水饮料', 6]
      ];
      
      const stmt = db.prepare('INSERT INTO categories (name, sort, status) VALUES (?, ?, 1)');
      for (const cat of categories) {
        stmt.run(cat[0], cat[1]);
      }
      console.log('✓ 默认分类创建成功');
    }
    
    // 检查是否已有商品
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productCount.count === 0) {
      insertDefaultProducts();
    }
    
    console.log('✓ 数据库初始化完成');
  } catch (error) {
    console.error('初始化数据错误:', error.message);
  }
}

function insertDefaultProducts() {
  const products = [
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
  
  const stmt = db.prepare(`
    INSERT INTO products (category_id, name, description, price, original_price, stock, sales, status, is_hot) 
    VALUES (?, ?, ?, ?, ?, ?, 0, 1, 0)
  `);
  
  for (const prod of products) {
    stmt.run(...prod);
  }
  console.log('✓ 默认商品创建成功');
}

// 导出 db 实例
module.exports = db;

// 自动初始化
initDatabase();
