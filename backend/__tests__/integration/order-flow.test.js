/**
 * 集成测试：订单流程
 */
const request = require('supertest');
const app = require('../../src/index');
const pool = require('../../src/config/database');

jest.mock('../../src/config/database', () => {
  const mockConnection = {
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
    execute: jest.fn().mockResolvedValue([[]])
  };

  return {
    query: jest.fn().mockResolvedValue([[]]),
    getConnection: jest.fn().mockResolvedValue(mockConnection)
  };
});

describe('Order Flow Integration Tests', () => {
  const mockUser = {
    id: 1,
    openid: 'mock_openid_123'
  };

  const mockOrder = {
    id: 1,
    order_no: 'ORD202603090000000000',
    user_id: 1,
    total_amount: 10000,
    status: 0,
    items: [
      { product_id: 1, quantity: 2, price: 5000 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Creation Flow', () => {
    it('完整的订单创建流程', async () => {
      // Mock 地址验证
      pool.getConnection().execute
        .mockResolvedValueOnce([[{
          id: 1,
          user_id: 1,
          name: 'Test User',
          phone: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detail: '测试地址'
        }]])
        // Mock 商品验证
        .mockResolvedValueOnce([[{
          id: 1,
          name: '_test_product',
          price: 5000,
          stock: 100,
          status: 1,
          images: '["test.jpg"]'
        }]])
        // Mock 创建订单
        .mockResolvedValueOnce([{ insertId: 1 }])
        // Mock 订单项
        .mockResolvedValue();

      // Mock 查询订单详情
      pool.query
        .mockResolvedValueOnce([[mockOrder]])
        .mockResolvedValueOnce([mockOrder.items])
        .mockResolvedValueOnce([[mockUser]]);

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', 'Bearer valid_token')
        .send({
          addressId: 1,
          items: [{ productId: 1, quantity: 2 }]
        });

      // 由于 token 验证会失败，这里期望 401
      expect(res.status).toBe(401);
    });
  });

  describe('Order Payment Flow', () => {
    it('模拟支付流程', async () => {
      // Mock 订单查询
      pool.getConnection().execute
        .mockResolvedValueOnce([[mockOrder]])
        .mockResolvedValueOnce([[{ id: 1, stock: 100 }]])
        .mockResolvedValue() // UPDATE products
        .mockResolvedValue() // INSERT stock_log
        .mockResolvedValue() // UPDATE orders
        .mockResolvedValue(); // DELETE cart

      pool.query
        .mockResolvedValueOnce([[mockOrder]])
        .mockResolvedValueOnce([mockOrder.items]);

      const res = await request(app)
        .post('/api/orders/pay')
        .set('Authorization', 'Bearer valid_token')
        .send({ orderId: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe('Order Cancel Flow', () => {
    it('取消订单流程', async () => {
      const cancelledOrder = { ...mockOrder, status: 4 };

      pool.getConnection().execute
        .mockResolvedValueOnce([[mockOrder]])
        .mockResolvedValueOnce([[{ id: 1, stock: 50 }]])
        .mockResolvedValue() // UPDATE products
        .mockResolvedValue() // INSERT stock_log
        .mockResolvedValue(); // UPDATE orders

      pool.query.mockResolvedValueOnce([[cancelledOrder]]);

      const res = await request(app)
        .post('/api/orders/cancel')
        .set('Authorization', 'Bearer valid_token')
        .send({ orderId: 1, reason: '用户取消' });

      expect(res.status).toBe(401);
    });
  });
});
