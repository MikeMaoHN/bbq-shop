/**
 * 认证控制器
 */
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../config');
const Response = require('../utils/response');
const User = require('../models/User');

class AuthController {
  /**
   * 微信登录
   */
  static async wxLogin(req, res) {
    try {
      const { code, encryptedData, iv } = req.body;

      if (!code) {
        return res.status(400).json(Response.error('缺少 code 参数'));
      }

      // 调用微信接口获取 openid 和 session_key
      const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: config.wx.appid,
          secret: config.wx.secret,
          js_code: code,
          grant_type: config.wx.grantType
        }
      });

      const { openid, session_key, errcode, errmsg } = wxResponse.data;

      if (errcode) {
        return res.status(400).json(Response.error(`微信登录失败：${errmsg}`));
      }

      // 查找或创建用户
      let user = await User.findByOpenid(openid);
      
      if (!user) {
        // 创建新用户
        const userId = await User.create({
          openid,
          session_key,
          nickname: encryptedData ? '新用户' : '新用户',
          avatar: '',
          phone: ''
        });
        user = await User.findById(userId);
      } else {
        // 更新 session_key
        await User.updateSessionKey(openid, session_key);
      }

      // 生成 JWT token
      const token = jwt.sign(
        { userId: user.id, openid: user.openid, isAdmin: false },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json(Response.success({
        token,
        user: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone
        }
      }, '登录成功'));
    } catch (error) {
      console.error('微信登录错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json(Response.error('用户不存在'));
      }

      res.json(Response.success(user));
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }

  /**
   * 更新用户信息
   */
  static async updateCurrentUser(req, res) {
    try {
      const { nickname, avatar, phone } = req.body;
      
      await User.update(req.user.userId, { nickname, avatar, phone });
      
      const user = await User.findById(req.user.userId);
      res.json(Response.success(user, '更新成功'));
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json(Response.error('服务器错误'));
    }
  }
}

module.exports = AuthController;
