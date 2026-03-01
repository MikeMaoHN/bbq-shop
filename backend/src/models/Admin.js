/**
 * 管理员模型 - SQLite 版本
 */
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static findByUsername(username) {
    return db.prepare('SELECT * FROM admins WHERE username = ?').get(username) || null;
  }

  static findById(id) {
    return db.prepare('SELECT * FROM admins WHERE id = ?').get(id) || null;
  }

  static async create({ username, password, role = 'admin' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO admins (username, password, role) VALUES (?, ?, ?)');
    return stmt.run(username, hashedPassword, role).lastInsertRowid;
  }

  static async verifyPassword(admin, password) {
    return bcrypt.compare(password, admin.password);
  }

  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, id);
  }

  static updateStatus(id, status) {
    db.prepare('UPDATE admins SET status = ? WHERE id = ?').run(status, id);
  }
}

module.exports = Admin;
