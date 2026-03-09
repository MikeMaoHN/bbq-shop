/**
 * 单元测试：验证中间件
 */
const { adminLoginValidation, orderCreateValidation } = require('../../src/middleware/validation');
const { generateToken, refreshToken } = require('../../src/middleware/auth');

describe('Validation Middleware', () => {
  // 模拟 request 和 response
  const createMockReq = (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query
  });

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const createMockNext = () => jest.fn();

  describe('adminLoginValidation', () => {
    it('应该通过有效的登录参数', async () => {
      const req = createMockReq({ username: 'admin', password: 'admin123' });
      const res = createMockRes();
      const next = createMockNext();

      // 获取验证数组中的最后一个函数（handleValidationErrors）
      const validator = adminLoginValidation[adminLoginValidation.length - 1];
      await validator(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('应该拒绝空用户名', async () => {
      const req = createMockReq({ username: '', password: 'admin123' });
      const res = createMockRes();
      const next = createMockNext();

      const validator = adminLoginValidation[adminLoginValidation.length - 1];
      await validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    it('应该拒绝过短的密码', async () => {
      const req = createMockReq({ username: 'admin', password: '123' });
      const res = createMockRes();
      const next = createMockNext();

      const validator = adminLoginValidation[adminLoginValidation.length - 1];
      await validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('orderCreateValidation', () => {
    it('应该通过有效的订单参数', async () => {
      const req = createMockReq({
        addressId: 1,
        items: [{ productId: 1, quantity: 2 }],
        remark: '请尽快发货'
      });
      const res = createMockRes();
      const next = createMockNext();

      const validator = orderCreateValidation[orderCreateValidation.length - 1];
      await validator(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('应该拒绝空的购物车', async () => {
      const req = createMockReq({ addressId: 1, items: [] });
      const res = createMockRes();
      const next = createMockNext();

      const validator = orderCreateValidation[orderCreateValidation.length - 1];
      await validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('应该拒绝无效的数量', async () => {
      const req = createMockReq({
        addressId: 1,
        items: [{ productId: 1, quantity: 100 }]
      });
      const res = createMockRes();
      const next = createMockNext();

      const validator = orderCreateValidation[orderCreateValidation.length - 1];
      await validator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe('Auth Middleware', () => {
  describe('generateToken', () => {
    it('应该生成有效的 JWT token', () => {
      const payload = { userId: 1, username: 'test' };
      const token = generateToken(payload, false);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('应该生成管理员 token', () => {
      const payload = { adminId: 1, username: 'admin' };
      const token = generateToken(payload, true);

      expect(token).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('应该刷新有效的 token', () => {
      const payload = { userId: 1, username: 'test' };
      const originalToken = generateToken(payload, false);
      
      const newToken = refreshToken(originalToken);
      
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(originalToken);
    });

    it('应该返回 null 对于无效的 token', () => {
      const result = refreshToken('invalid_token');
      expect(result).toBeNull();
    });
  });
});
