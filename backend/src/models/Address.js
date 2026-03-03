/**
 * 收货地址模型 - MySQL 版本
 */
const pool = require('../config/database');

class Address {
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [userId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM addresses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findDefault(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM addresses WHERE user_id = ? AND is_default = 1',
      [userId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { userId, name, phone, province, city, district, detail, isDefault } = data;

    if (isDefault) {
      await pool.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const [result] = await pool.execute(
      'INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, phone, province, city, district, detail, isDefault ? 1 : 0]
    );
    return result.insertId;
  }

  static async update(id, userId, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.province !== undefined) { fields.push('province = ?'); values.push(data.province); }
    if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
    if (data.district !== undefined) { fields.push('district = ?'); values.push(data.district); }
    if (data.detail !== undefined) { fields.push('detail = ?'); values.push(data.detail); }

    if (data.isDefault !== undefined) {
      fields.push('is_default = ?');
      values.push(data.isDefault ? 1 : 0);
      if (data.isDefault) {
        await pool.execute(
          'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?',
          [userId, id]
        );
      }
    }

    if (fields.length === 0) return true;

    values.push(id, userId);
    await pool.execute(
      `UPDATE addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    return true;
  }

  static async delete(id, userId) {
    await pool.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  }
}

module.exports = Address;
