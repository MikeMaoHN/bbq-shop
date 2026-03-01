/**
 * 库存流水模型 - SQLite 版本
 */
const db = require('../config/database');

class StockLog {
  static create(data) {
    const { productId, changeQty, beforeStock, afterStock, reason, referenceType, referenceId, operatorId, remark } = data;
    
    const stmt = db.prepare(`
      INSERT INTO stock_logs (product_id, change_qty, before_stock, after_stock, reason, reference_type, reference_id, operator_id, remark) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(productId, changeQty, beforeStock, afterStock, reason, referenceType, referenceId, operatorId, remark).lastInsertRowid;
  }

  static findByProductId(productId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const list = db.prepare(`
      SELECT sl.*, p.name as product_name
      FROM stock_logs sl
      LEFT JOIN products p ON sl.product_id = p.id
      WHERE sl.product_id = ?
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?
    `).all(productId, limit, offset);
    
    const total = db.prepare('SELECT COUNT(*) as total FROM stock_logs WHERE product_id = ?').get(productId).total;
    return { list, total, page, limit };
  }

  static findAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const list = db.prepare(`
      SELECT sl.*, p.name as product_name
      FROM stock_logs sl
      LEFT JOIN products p ON sl.product_id = p.id
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    const total = db.prepare('SELECT COUNT(*) as total FROM stock_logs').get().total;
    return { list, total, page, limit };
  }

  static getLowStockProducts(threshold = 10) {
    return db.prepare('SELECT * FROM products WHERE stock <= ? AND status = 1 ORDER BY stock ASC').all(threshold);
  }
}

module.exports = StockLog;
