/**
 * 用户模型 - MySQL 版本
 */
const pool = require('../config/database');

class User {
  static async findByOpenid(openid) {
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ openid, session_key, nickname, avatar, phone }) {
    const [result] = await pool.query(
      'INSERT INTO users (openid, session_key, nickname, avatar, phone) VALUES (?, ?, ?, ?, ?)',
      [openid, session_key, nickname, avatar, phone]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }

    if (fields.length === 0) return true;

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async updateSessionKey(openid, sessionKey) {
    await pool.query('UPDATE users SET session_key = ? WHERE openid = ?', [sessionKey, openid]);
  }
}

module.exports = User;
