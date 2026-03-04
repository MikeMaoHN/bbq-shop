/**
 * 库存流水模型 - MySQL 版本
 */
const pool = require('../config/database');

class StockLog {
  static async create(data) {
    const { productId, changeQty, beforeStock, afterStock, reason, referenceType, referenceId, operatorId, remark } = data;

    const [result] = await pool.query(
      `INSERT INTO stock_logs (product_id, change_qty, before_stock, after_stock, reason, reference_type, reference_id, operator_id, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, changeQty, beforeStock, afterStock, reason, referenceType, referenceId, operatorId, remark]
    );
    return result.insertId;
  }

  static async findByProductId(productId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [list] = await pool.query(
      `SELECT sl.*, p.name as product_name
       FROM stock_logs sl
       LEFT JOIN products p ON sl.product_id = p.id
       WHERE sl.product_id = ?
       ORDER BY sl.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM stock_logs WHERE product_id = ?',
      [productId]
    );
    return { list, total, page, limit };
  }

  static async findAll(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [list] = await pool.query(
      `SELECT sl.*, p.name as product_name
       FROM stock_logs sl
       LEFT JOIN products p ON sl.product_id = p.id
       ORDER BY sl.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM stock_logs');
    return { list, total, page, limit };
  }

  static async getLowStockProducts(threshold = 10) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE stock <= ? AND status = 1 ORDER BY stock ASC',
      [threshold]
    );
    return rows;
  }
}

module.exports = StockLog;
