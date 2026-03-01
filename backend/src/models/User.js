/**
 * 用户模型 - SQLite 版本
 */
const db = require('../config/database');

class User {
  static findByOpenid(openid) {
    return db.prepare('SELECT * FROM users WHERE openid = ?').get(openid) || null;
  }

  static findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  }

  static create({ openid, session_key, nickname, avatar, phone }) {
    const stmt = db.prepare(`
      INSERT INTO users (openid, session_key, nickname, avatar, phone) 
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(openid, session_key, nickname, avatar, phone).lastInsertRowid;
  }

  static update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(data.nickname);
    }
    if (data.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(data.avatar);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    
    if (fields.length === 0) return true;
    
    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
  }

  static updateSessionKey(openid, sessionKey) {
    db.prepare('UPDATE users SET session_key = ? WHERE openid = ?').run(sessionKey, openid);
  }
}

module.exports = User;
