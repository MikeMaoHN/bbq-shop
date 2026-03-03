/**
 * 管理员模型 - MySQL 版本
 */
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async findByUsername(username) {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ username, password, role = 'admin' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    return result.insertId;
  }

  static async verifyPassword(admin, password) {
    return bcrypt.compare(password, admin.password);
  }

  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  static async updateStatus(id, status) {
    await pool.execute('UPDATE admins SET status = ? WHERE id = ?', [status, id]);
  }
}

module.exports = Admin;
