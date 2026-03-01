/**
 * 商品分类模型 - SQLite 版本
 */
const db = require('../config/database');

class Category {
  static findAll() {
    return db.prepare('SELECT * FROM categories WHERE status = 1 ORDER BY sort ASC, id ASC').all();
  }

  static findAllWithCount() {
    return db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 1
      WHERE c.status = 1 
      GROUP BY c.id 
      ORDER BY c.sort ASC, c.id ASC
    `).all();
  }

  static findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) || null;
  }

  static create({ name, icon, sort = 0 }) {
    const stmt = db.prepare('INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)');
    return stmt.run(name, icon, sort).lastInsertRowid;
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.icon !== undefined) {
      fields.push('icon = ?');
      values.push(data.icon);
    }
    if (data.sort !== undefined) {
      fields.push('sort = ?');
      values.push(data.sort);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    
    if (fields.length === 0) return true;
    
    values.push(id);
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
  }

  static delete(id) {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  static getAllForAdmin(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const list = db.prepare(`
      SELECT * FROM categories ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    const total = db.prepare('SELECT COUNT(*) as total FROM categories').get().total;
    return { list, total, page, limit };
  }
}

module.exports = Category;
