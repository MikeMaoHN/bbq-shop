/**
 * 订单控制器 - MySQL 版本
 */
const Response = require('../utils/response');
const Order = require('../models/Order');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const db = require('../config/database');

class OrderController {
  /**
   * 生成订单号
   */
  static generateOrderNo() {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${dateStr}${random}`;
  }

  /**
   * 创建订单
   */
  static async create(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const userId = req.user.userId;
      const { addressId, remark, items } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json(Response.error('请选择商品'));
      }

      const [addressRows] = await connection.execute(
        'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
        [addressId, userId]
      );
      
      if (!addressRows || addressRows.length === 0) {
        await connection.rollback();
        return res.status(400).json(Response.error('请选择收货地址'));
      }
      
      const address = addressRows[0];
      const receiverAddress = `${address.province || ''}${address.city || ''}${address.district || ''}${address.detail}`;

      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of items) {
        const [productRows] = await connection.execute(
          'SELECT * FROM products WHERE id = ? AND status = 1',
          [item.productId]
        );
        
        if (!productRows || productRows.length === 0) {
          await connection.rollback();
          return res.status(400).json(Response.error(`商品 ${item.productId} 不存在或已下架`));
        }
        
        const product = productRows[0];
        
        if (product.stock < item.quantity) {
          await connection.rollback();
          return res.status(400).json(Response.error(`商品 ${product.name} 库存不足`));
        }
        
        totalAmount += product.price * item.quantity;
        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.images ? JSON.parse(product.images)[0] : '',
          price: product.price,
          quantity: item.quantity
        });
      }

      const orderNo = this.generateOrderNo();
      const orderId = await Order.create({
        orderNo,
        userId,
        totalAmount,
        payAmount: totalAmount,
        freightAmount: 0,
        status: 0,
        remark,
        receiverName: address.name,
        receiverPhone: address.phone,
        receiverAddress
      }, connection);

      await Order.addItems(orderId, orderItems, connection);

      await connection.commit();
      
      const order = await Order.findById(orderId);
      res.json(Response.success(order, '订单创建成功，请尽快支付'));
    } catch (error) {
      await connection.rollback();
      console.error('创建订单错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    } finally {
      connection.release();
    }
  }

  /**
   * 模拟支付
   */
  static async pay(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const userId = req.user.userId;
      const { orderId } = req.body;
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        await connection.rollback();
        return res.status(404).json(Response.error('订单不存在'));
      }
      
      if (order.user_id !== userId) {
        await connection.rollback();
        return res.status(403).json(Response.error('无权操作此订单'));
      }
      
      if (order.status !== 0) {
        await connection.rollback();
        return res.status(400).json(Response.error('订单状态不正确'));
      }

      for (const item of order.items) {
        const product = await Product.findById(item.product_id);
        const beforeStock = product.stock;
        const afterStock = beforeStock - item.quantity;
        
        await Product.update(item.product_id, { stock: afterStock }, connection);
        
        await StockLog.create({
          productId: item.product_id,
          changeQty: -item.quantity,
          beforeStock,
          afterStock,
          reason: '下单',
          referenceType: 'order',
          referenceId: orderId
        }, connection);
      }

      const now = new Date();
      await Order.updateStatus(orderId, 1, { paidAt: now }, connection);

      for (const item of order.items) {
        await CartItem.deleteByUserAndProduct(userId, item.product_id, connection);
      }

      await connection.commit();
      
      const updatedOrder = await Order.findById(orderId);
      res.json(Response.success(updatedOrder, '支付成功'));
    } catch (error) {
      await connection.rollback();
      console.error('支付错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    } finally {
      connection.release();
    }
  }

  /**
   * 取消订单
   */
  static async cancel(req, res) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const userId = req.user.userId;
      const { orderId } = req.body;
      const { reason = '用户取消' } = req.body;
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        await connection.rollback();
        return res.status(404).json(Response.error('订单不存在'));
      }
      
      if (order.user_id !== userId) {
        await connection.rollback();
        return res.status(403).json(Response.error('无权操作此订单'));
      }
      
      if (order.status !== 0) {
        await connection.rollback();
        return res.status(400).json(Response.error('只能取消待付款订单'));
      }

      for (const item of order.items) {
        const product = await Product.findById(item.product_id);
        const beforeStock = product.stock;
        const afterStock = beforeStock + item.quantity;
        
        await Product.update(item.product_id, { stock: afterStock }, connection);
        
        await StockLog.create({
          productId: item.product_id,
          changeQty: item.quantity,
          beforeStock,
          afterStock,
          reason: '取消订单',
          referenceType: 'order',
          referenceId: orderId
        }, connection);
      }

      const now = new Date();
      await Order.updateStatus(orderId, 4, { cancelledAt: now }, connection);
      await Order.cancel(orderId, reason, connection);

      await connection.commit();
      
      res.json(Response.success(null, '订单已取消'));
    } catch (error) {
      await connection.rollback();
      console.error('取消订单错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    } finally {
      connection.release();
    }
  }

  /**
   * 确认收货
   */
  static async confirmReceipt(req, res) {
    try {
      const userId = req.user.userId;
      const { orderId } = req.body;
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json(Response.error('订单不存在'));
      }
      
      if (order.user_id !== userId) {
        return res.status(403).json(Response.error('无权操作此订单'));
      }
      
      if (order.status !== 2) {
        return res.status(400).json(Response.error('订单状态不正确'));
      }

      const now = new Date();
      await Order.updateStatus(orderId, 3, { completedAt: now });
      
      res.json(Response.success(null, '确认收货成功'));
    } catch (error) {
      console.error('确认收货错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取订单列表
   */
  static async list(req, res) {
    try {
      const userId = req.user.userId;
      const { status, page = 1, limit = 20 } = req.query;
      
      const result = await Order.findByUserId(userId, {
        status: status !== undefined ? parseInt(status) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json(Response.success(result));
    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取订单详情
   */
  static async detail(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json(Response.error('订单不存在'));
      }
      
      if (order.user_id !== userId) {
        return res.status(403).json(Response.error('无权查看此订单'));
      }
      
      res.json(Response.success(order));
    } catch (error) {
      console.error('获取订单详情错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = OrderController;
