/**
 * 订单模型 - SQLite 版本
 */
const db = require('../config/database');

class Order {
  static create(data) {
    const {
      orderNo, userId, totalAmount, payAmount, freightAmount,
      status, remark, receiverName, receiverPhone, receiverAddress
    } = data;
    
    const stmt = db.prepare(`
      INSERT INTO orders (order_no, user_id, total_amount, pay_amount, freight_amount, 
       status, remark, receiver_name, receiver_phone, receiver_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(orderNo, userId, totalAmount, payAmount, freightAmount, status, remark, 
       receiverName, receiverPhone, receiverAddress).lastInsertRowid;
  }

  static addItems(orderId, items) {
    const stmt = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        stmt.run(orderId, item.productId, item.productName, item.productImage, item.price, item.quantity);
      }
    });
    
    insertMany(items);
  }

  static findById(id) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return null;
    
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    return { ...order, items };
  }

  static findByOrderNo(orderNo) {
    const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo);
    if (!order) return null;
    
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  }

  static findByUserId(userId, options = {}) {
    const { status, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    let where = 'WHERE user_id = ?';
    const params = [userId];
    
    if (status !== undefined && status !== null) {
      where += ' AND status = ?';
      params.push(status);
    }
    
    const list = db.prepare(`
      SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    
    const total = db.prepare(`SELECT COUNT(*) as total FROM orders ${where}`).get(...params).total;
    
    for (const order of list) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    }
    
    return { list, total, page, limit };
  }

  static updateStatus(id, status, extraData = {}) {
    const fields = ['status = ?'];
    const values = [status];
    
    if (status === 1 && extraData.paidAt) {
      fields.push('paid_at = ?');
      values.push(extraData.paidAt);
    }
    if (status === 2 && extraData.shippedAt) {
      fields.push('shipped_at = ?');
      values.push(extraData.shippedAt);
    }
    if (status === 3 && extraData.completedAt) {
      fields.push('completed_at = ?');
      values.push(extraData.completedAt);
    }
    if (status === 4 && extraData.cancelledAt) {
      fields.push('cancelled_at = ?');
      values.push(extraData.cancelledAt);
    }
    if (extraData.logisticsNo) {
      fields.push('logistics_no = ?');
      values.push(extraData.logisticsNo);
    }
    if (extraData.logisticsCompany) {
      fields.push('logistics_company = ?');
      values.push(extraData.logisticsCompany);
    }
    if (extraData.cancelReason) {
      fields.push('cancel_reason = ?');
      values.push(extraData.cancelReason);
    }
    
    values.push(id);
    db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  static ship(id, logisticsNo, logisticsCompany) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(`
      UPDATE orders SET status = 2, logistics_no = ?, logistics_company = ?, shipped_at = ? 
      WHERE id = ? AND status = 1
    `).run(logisticsNo, logisticsCompany, now, id);
  }

  static cancel(id, reason) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(`
      UPDATE orders SET status = 4, cancel_reason = ?, cancelled_at = ? 
      WHERE id = ? AND status = 0
    `).run(reason, now, id);
  }

  static getAllForAdmin(options = {}) {
    const { status, userId, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    let where = 'WHERE 1=1';
    const params = [];
    
    if (status !== undefined && status !== null) {
      where += ' AND o.status = ?';
      params.push(status);
    }
    
    if (userId) {
      where += ' AND o.user_id = ?';
      params.push(userId);
    }
    
    const list = db.prepare(`
      SELECT o.*, u.nickname as user_nickname, u.phone as user_phone 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ${where} 
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    
    const total = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params).total;
    
    for (const order of list) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    }
    
    return { list, total, page, limit };
  }

  static getStats(days = 7) {
    const orderStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as unpaid_orders,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as pending_ship_orders,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as pending_recv_orders,
        SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 3 THEN total_amount ELSE 0 END) / 100 as total_revenue
      FROM orders 
      WHERE created_at >= datetime('now', ? || ' days')
    `).get(`-${days}`);
    
    const productStats = db.prepare(`
      SELECT p.id, p.name, SUM(oi.quantity) as sales 
      FROM order_items oi 
      INNER JOIN products p ON oi.product_id = p.id 
      INNER JOIN orders o ON oi.order_id = o.id 
      WHERE o.status = 3 AND o.created_at >= datetime('now', ? || ' days')
      GROUP BY p.id 
      ORDER BY sales DESC 
      LIMIT 10
    `).all(`-${days}`);
    
    return { orderStats, productStats };
  }
}

module.exports = Order;
