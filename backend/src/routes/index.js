/**
 * 小程序端路由
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

const AuthController = require('../controllers/authController');
const CategoryController = require('../controllers/categoryController');
const ProductController = require('../controllers/productController');
const CartController = require('../controllers/cartController');
const AddressController = require('../controllers/addressController');
const OrderController = require('../controllers/orderController');

// 认证
router.post('/auth/wx-login', AuthController.wxLogin);

// 用户
router.get('/user/info', authMiddleware, AuthController.getCurrentUser);
router.put('/user/info', authMiddleware, AuthController.updateCurrentUser);

// 分类
router.get('/categories', CategoryController.list);

// 商品
router.get('/products', ProductController.list);
router.get('/products/:id', ProductController.detail);

// 购物车
router.get('/cart', authMiddleware, CartController.list);
router.post('/cart/items', authMiddleware, CartController.add);
router.put('/cart/items/:id', authMiddleware, CartController.updateQuantity);
router.put('/cart/items/:id/checked', authMiddleware, CartController.updateChecked);
router.put('/cart/checked', authMiddleware, CartController.updateAllChecked);
router.delete('/cart/items/:id', authMiddleware, CartController.delete);
router.delete('/cart', authMiddleware, CartController.clear);

// 地址
router.get('/addresses', authMiddleware, AddressController.list);
router.get('/addresses/:id', authMiddleware, AddressController.detail);
router.post('/addresses', authMiddleware, AddressController.create);
router.put('/addresses/:id', authMiddleware, AddressController.update);
router.delete('/addresses/:id', authMiddleware, AddressController.delete);
router.put('/addresses/:id/default', authMiddleware, AddressController.setDefault);

// 订单
router.post('/orders', authMiddleware, OrderController.create);
router.post('/orders/pay', authMiddleware, OrderController.pay);
router.post('/orders/cancel', authMiddleware, OrderController.cancel);
router.post('/orders/confirm', authMiddleware, OrderController.confirmReceipt);
router.get('/orders', authMiddleware, OrderController.list);
router.get('/orders/:id', authMiddleware, OrderController.detail);

module.exports = router;
