const jwt = require('jsonwebtoken');
const config = require('../config');
const Response = require('../utils/response');

/**
 * JWT 认证中间件
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(Response.error('未授权访问', 401));
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(Response.error('Token 已过期', 401));
    }
    return res.status(401).json(Response.error('Token 无效', 401));
  }
};

/**
 * 管理员认证中间件
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(Response.error('未授权访问', 401));
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    if (!decoded.isAdmin) {
      return res.status(403).json(Response.error('权限不足', 403));
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(Response.error('Token 已过期', 401));
    }
    return res.status(401).json(Response.error('Token 无效', 401));
  }
};

module.exports = { authMiddleware, adminMiddleware };
