/**
 * 购物车模型 - MySQL 版本
 */
const pool = require('../config/database');

class CartItem {
  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT ci.*, p.name, p.price, p.images, p.stock, p.status
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ci.*, p.name, p.price, p.images, p.stock, p.status
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByUserAndProduct(userId, productId) {
    const [rows] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    return rows[0] || null;
  }

  static async addOrUpdate(userId, productId, quantity, checked = 1) {
    const existing = await this.findByUserAndProduct(userId, productId);

    if (existing) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ?, checked = ? WHERE id = ?',
        [quantity, checked, existing.id]
      );
      return existing.id;
    } else {
      const [result] = await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity, checked) VALUES (?, ?, ?, ?)',
        [userId, productId, quantity, checked]
      );
      return result.insertId;
    }
  }

  static async updateQuantity(id, userId, quantity) {
    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, id, userId]
    );
  }

  static async updateChecked(id, userId, checked) {
    await pool.query(
      'UPDATE cart_items SET checked = ? WHERE id = ? AND user_id = ?',
      [checked ? 1 : 0, id, userId]
    );
  }

  static async updateAllChecked(userId, checked) {
    await pool.query(
      'UPDATE cart_items SET checked = ? WHERE user_id = ?',
      [checked ? 1 : 0, userId]
    );
  }

  static async delete(id, userId) {
    await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
  }

  static async deleteByUserAndProduct(userId, productId) {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
  }

  static async clear(userId) {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  }

  static async getCheckedItems(userId) {
    const [rows] = await pool.query(
      `SELECT ci.*, p.name, p.price, p.images, p.stock, p.status
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ? AND ci.checked = 1 AND p.status = 1
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = CartItem;
