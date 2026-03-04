/**
 * 商品分类模型 - MySQL 版本
 */
const pool = require('../config/database');

class Category {
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE status = 1 ORDER BY sort ASC, id ASC'
    );
    return rows;
  }

  static async findAllWithCount() {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 1
      WHERE c.status = 1
      GROUP BY c.id
      ORDER BY c.sort ASC, c.id ASC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, icon, sort = 0 }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)',
      [name, icon, sort]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.sort !== undefined) { fields.push('sort = ?'); values.push(data.sort); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return true;

    values.push(id);
    await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  }

  static async getAllForAdmin(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [list] = await pool.query(
      'SELECT * FROM categories ORDER BY sort ASC, id ASC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM categories');
    return { list, total, page, limit };
  }
}

module.exports = Category;
