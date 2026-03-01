/**
 * 购物车模型 - SQLite 版本
 */
const db = require('../config/database');

class CartItem {
  static findByUserId(userId) {
    return db.prepare(`
      SELECT ci.*, p.name, p.price, p.images, p.stock, p.status 
      FROM cart_items ci 
      INNER JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ? 
      ORDER BY ci.created_at DESC
    `).all(userId);
  }

  static findById(id) {
    return db.prepare(`
      SELECT ci.*, p.name, p.price, p.images, p.stock, p.status 
      FROM cart_items ci 
      INNER JOIN products p ON ci.product_id = p.id 
      WHERE ci.id = ?
    `).get(id) || null;
  }

  static findByUserAndProduct(userId, productId) {
    return db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId) || null;
  }

  static addOrUpdate(userId, productId, quantity, checked = 1) {
    const existing = this.findByUserAndProduct(userId, productId);
    
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ?, checked = ? WHERE id = ?').run(quantity, checked, existing.id);
      return existing.id;
    } else {
      const stmt = db.prepare('INSERT INTO cart_items (user_id, product_id, quantity, checked) VALUES (?, ?, ?, ?)');
      return stmt.run(userId, productId, quantity, checked).lastInsertRowid;
    }
  }

  static updateQuantity(id, userId, quantity) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, id, userId);
  }

  static updateChecked(id, userId, checked) {
    db.prepare('UPDATE cart_items SET checked = ? WHERE id = ? AND user_id = ?').run(checked ? 1 : 0, id, userId);
  }

  static updateAllChecked(userId, checked) {
    db.prepare('UPDATE cart_items SET checked = ? WHERE user_id = ?').run(checked ? 1 : 0, userId);
  }

  static delete(id, userId) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, userId);
  }

  static deleteByUserAndProduct(userId, productId) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(userId, productId);
  }

  static clear(userId) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  }

  static getCheckedItems(userId) {
    return db.prepare(`
      SELECT ci.*, p.name, p.price, p.images, p.stock, p.status 
      FROM cart_items ci 
      INNER JOIN products p ON ci.product_id = p.id 
      WHERE ci.user_id = ? AND ci.checked = 1 AND p.status = 1
      ORDER BY ci.created_at DESC
    `).all(userId);
  }
}

module.exports = CartItem;
