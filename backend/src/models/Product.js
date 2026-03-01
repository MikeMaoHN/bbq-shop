/**
 * 商品模型 - SQLite 版本
 */
const db = require('../config/database');

class Product {
  static findAll(options = {}) {
    const { categoryId, isHot, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    let where = 'WHERE p.status = 1';
    const params = [];
    
    if (categoryId) {
      where += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    
    if (isHot) {
      where += ' AND p.is_hot = 1';
    }
    
    const paramsStr = params.join(', ');
    const list = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${where} 
      ORDER BY p.sort ASC, p.id DESC 
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    
    const total = db.prepare(`
      SELECT COUNT(*) as total FROM products p ${where}
    `).get(...params).total;
    
    return { list, total, page, limit };
  }

  static findById(id) {
    return db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `).get(id) || null;
  }

  static create(data) {
    const { categoryId, name, description, images, price, originalPrice, stock, isHot, sort } = data;
    const stmt = db.prepare(`
      INSERT INTO products (category_id, name, description, images, price, original_price, stock, is_hot, sort) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      categoryId, name, description, JSON.stringify(images), price, originalPrice, stock, isHot ? 1 : 0, sort || 0
    ).lastInsertRowid;
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(data.categoryId);
    }
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.images !== undefined) {
      fields.push('images = ?');
      values.push(JSON.stringify(data.images));
    }
    if (data.price !== undefined) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (data.originalPrice !== undefined) {
      fields.push('original_price = ?');
      values.push(data.originalPrice);
    }
    if (data.stock !== undefined) {
      fields.push('stock = ?');
      values.push(data.stock);
    }
    if (data.isHot !== undefined) {
      fields.push('is_hot = ?');
      values.push(data.isHot ? 1 : 0);
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
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
  }

  static delete(id) {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }

  static updateStock(id, quantity, checkStock = true) {
    if (checkStock) {
      const row = db.prepare('SELECT stock FROM products WHERE id = ?').get(id);
      if (!row || row.stock < quantity) {
        return false;
      }
    }
    
    const info = db.prepare(`
      UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
    `).run(quantity, id, quantity);
    return info.changes > 0;
  }

  static increaseStock(id, quantity) {
    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, id);
  }

  static getStock(id) {
    const row = db.prepare('SELECT stock FROM products WHERE id = ?').get(id);
    return row?.stock || 0;
  }

  static search(keyword, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${keyword}%`;
    
    const list = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.status = 1 AND (p.name LIKE ? OR p.description LIKE ?)
      ORDER BY p.sort ASC, p.id DESC 
      LIMIT ? OFFSET ?
    `).all(searchPattern, searchPattern, limit, offset);
    
    const total = db.prepare(`
      SELECT COUNT(*) as total FROM products p 
      WHERE p.status = 1 AND (p.name LIKE ? OR p.description LIKE ?)
    `).get(searchPattern, searchPattern).total;
    
    return { list, total, page, limit };
  }

  static getAllForAdmin(options = {}) {
    const { page = 1, limit = 20, status, categoryId } = options;
    const offset = (page - 1) * limit;
    
    let where = 'WHERE 1=1';
    const params = [];
    
    if (status !== undefined) {
      where += ' AND p.status = ?';
      params.push(status);
    }
    
    if (categoryId) {
      where += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    
    const list = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${where} 
      ORDER BY p.id DESC 
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    
    const total = db.prepare(`
      SELECT COUNT(*) as total FROM products p ${where}
    `).get(...params).total;
    
    return { list, total, page, limit };
  }
}

module.exports = Product;
