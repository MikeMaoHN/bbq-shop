/**
 * 收货地址模型 - SQLite 版本
 */
const db = require('../config/database');

class Address {
  static findByUserId(userId) {
    return db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(userId);
  }

  static findById(id) {
    return db.prepare('SELECT * FROM addresses WHERE id = ?').get(id) || null;
  }

  static findDefault(userId) {
    return db.prepare('SELECT * FROM addresses WHERE user_id = ? AND is_default = 1').get(userId) || null;
  }

  static create(data) {
    const { userId, name, phone, province, city, district, detail, isDefault } = data;
    
    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    }
    
    const stmt = db.prepare(`
      INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(userId, name, phone, province, city, district, detail, isDefault ? 1 : 0).lastInsertRowid;
  }

  static update(id, userId, data) {
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.province !== undefined) {
      fields.push('province = ?');
      values.push(data.province);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      values.push(data.city);
    }
    if (data.district !== undefined) {
      fields.push('district = ?');
      values.push(data.district);
    }
    if (data.detail !== undefined) {
      fields.push('detail = ?');
      values.push(data.detail);
    }
    if (data.isDefault !== undefined) {
      fields.push('is_default = ?');
      values.push(data.isDefault ? 1 : 0);
      
      if (data.isDefault) {
        db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?').run(userId, id);
      }
    }
    
    if (fields.length === 0) return true;
    
    values.push(id, userId);
    db.prepare(`UPDATE addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return true;
  }

  static delete(id, userId) {
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, userId);
  }
}

module.exports = Address;
