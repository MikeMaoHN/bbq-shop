# 烧烤食材售卖微信小程序 PRD 文档

## 1. 项目概述

### 1.1 项目背景
为烧烤食材售卖店开发一套完整的线上销售系统，包含微信小程序客户端、Web 管理端和服务后台，实现商品展示、在线下单、库存管理、订单发货等核心功能。

### 1.2 项目目标
- 为客户提供便捷的线上选购体验
- 为店家提供高效的商品和订单管理工具
- 实现完整的电商交易闭环

### 1.3 用户角色
| 角色 | 描述 |
|------|------|
| 客户 | 微信小程序用户，浏览商品、下单购买 |
| 店家管理员 | Web 管理端用户，管理商品、库存、订单 |

---

## 2. 功能需求

### 2.1 小程序端（客户端）

#### 2.1.1 用户注册/登录
- 微信一键授权登录
- 自动获取用户昵称、头像
- 绑定手机号（可选）

#### 2.1.2 首页
- 轮播图展示活动/推荐
- 商品分类导航
- 热销商品推荐
- 搜索功能

#### 2.1.3 商品列表/详情页
- 按分类筛选商品
- 商品图片、名称、价格、库存展示
- 商品详情（描述、规格）
- 加入购物车/立即购买

#### 2.1.4 购物车
- 商品增删改查
- 数量调整
- 价格合计
- 批量结算

#### 2.1.5 订单模块
- 确认订单（选择地址、备注）
- 订单列表（全部、待付款、待发货、待收货、已完成）
- 订单详情
- 订单取消（待付款状态）

#### 2.1.6 个人中心
- 用户信息展示
- 收货地址管理
- 订单入口
- 联系客服

### 2.2 Web 管理端（店家端）

#### 2.2.1 登录认证
- 账号密码登录
- 权限管理

#### 2.2.2 商品管理
- 商品列表（增删改查）
- 商品分类管理
- 商品图片上传
- 上下架管理

#### 2.2.3 库存管理
- 库存查询
- 库存预警设置
- 库存调整记录

#### 2.2.4 订单管理
- 订单列表（按状态筛选）
- 订单详情查看
- 发货操作（填写物流信息）
- 订单备注

#### 2.2.5 数据统计
- 销售统计（日/周/月）
- 商品销量排行
- 订单状态分布

### 2.3 服务后台（API）

#### 2.3.1 用户服务
- 微信登录验证
- 用户信息管理

#### 2.3.2 商品服务
- 商品 CRUD
- 分类管理
- 库存查询/扣减

#### 2.3.3 订单服务
- 订单创建
- 订单状态流转
- 支付回调处理

#### 2.3.4 地址服务
- 收货地址 CRUD

---

## 3. 技术架构

### 3.1 技术栈
| 模块 | 技术选型 |
|------|----------|
| 小程序端 | 微信小程序原生开发 |
| Web 管理端 | Vue3 + Element Plus |
| 服务后台 | Node.js + Express |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis（可选） |

### 3.2 系统架构图
```
┌─────────────────┐     ┌─────────────────┐
│   微信小程序     │     │   Web 管理端     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │  API Gateway │
              └──────┬──────┘
                     │
         ┌───────────▼───────────┐
         │    Node.js Server     │
         │  (Express Framework)  │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │       MySQL DB        │
         └───────────────────────┘
```

---

## 4. 数据库设计

### 4.1 用户表 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| openid | VARCHAR(64) | 微信 openid |
| nickname | VARCHAR(64) | 昵称 |
| avatar | VARCHAR(255) | 头像 URL |
| phone | VARCHAR(20) | 手机号 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.2 商品分类表 (categories)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(64) | 分类名称 |
| sort | INT | 排序 |
| status | TINYINT | 状态 (1 启用/0 禁用) |

### 4.3 商品表 (products)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| category_id | INT | 分类 ID |
| name | VARCHAR(128) | 商品名称 |
| description | TEXT | 描述 |
| images | JSON | 图片 URLs |
| price | DECIMAL(10,2) | 价格 |
| stock | INT | 库存 |
| status | TINYINT | 状态 (1 上架/0 下架) |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.4 收货地址表 (addresses)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 用户 ID |
| name | VARCHAR(64) | 收货人 |
| phone | VARCHAR(20) | 电话 |
| province | VARCHAR(64) | 省 |
| city | VARCHAR(64) | 市 |
| district | VARCHAR(64) | 区 |
| detail | VARCHAR(255) | 详细地址 |
| is_default | TINYINT | 是否默认 |

### 4.5 购物车表 (cart_items)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| user_id | BIGINT | 用户 ID |
| product_id | BIGINT | 商品 ID |
| quantity | INT | 数量 |
| checked | TINYINT | 是否选中 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.6 订单表 (orders)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| order_no | VARCHAR(32) | 订单号 |
| user_id | BIGINT | 用户 ID |
| total_amount | DECIMAL(10,2) | 订单总额 |
| status | TINYINT | 状态 (0 待付款/1 待发货/2 待收货/3 已完成/4 已取消) |
| remark | VARCHAR(255) | 用户备注 |
| receiver_name | VARCHAR(64) | 收货人 |
| receiver_phone | VARCHAR(20) | 收货电话 |
| receiver_address | VARCHAR(255) | 收货地址 |
| logistics_no | VARCHAR(64) | 物流单号 |
| logistics_company | VARCHAR(64) | 物流公司 |
| paid_at | DATETIME | 支付时间 |
| shipped_at | DATETIME | 发货时间 |
| completed_at | DATETIME | 完成时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4.7 订单商品表 (order_items)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| order_id | BIGINT | 订单 ID |
| product_id | BIGINT | 商品 ID |
| product_name | VARCHAR(128) | 商品名称 |
| product_image | VARCHAR(255) | 商品图片 |
| price | DECIMAL(10,2) | 单价 |
| quantity | INT | 数量 |

### 4.8 库存流水表 (stock_logs)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| product_id | BIGINT | 商品 ID |
| change_qty | INT | 变动数量 (+/-) |
| before_stock | INT | 变动前库存 |
| after_stock | INT | 变动后库存 |
| reason | VARCHAR(64) | 原因 (下单/取消/手动调整) |
| reference_id | BIGINT | 关联 ID(订单 ID 等) |
| created_at | DATETIME | 创建时间 |

### 4.9 管理员表 (admins)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(64) | 用户名 |
| password | VARCHAR(128) | 密码 (加密) |
| role | VARCHAR(32) | 角色 |
| status | TINYINT | 状态 |
| created_at | DATETIME | 创建时间 |

---

## 5. API 接口设计

### 5.1 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/wx-login | 微信登录 |
| GET | /api/user/info | 获取用户信息 |
| PUT | /api/user/info | 更新用户信息 |

### 5.2 地址接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/addresses | 地址列表 |
| POST | /api/addresses | 新增地址 |
| PUT | /api/addresses/:id | 更新地址 |
| DELETE | /api/addresses/:id | 删除地址 |

### 5.3 商品接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/products | 商品列表 |
| GET | /api/products/:id | 商品详情 |
| GET | /api/categories | 分类列表 |

### 5.4 购物车接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/cart | 购物车列表 |
| POST | /api/cart/items | 添加商品 |
| PUT | /api/cart/items/:id | 更新数量 |
| DELETE | /api/cart/items/:id | 删除商品 |

### 5.5 订单接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 订单列表 |
| GET | /api/orders/:id | 订单详情 |
| PUT | /api/orders/:id/cancel | 取消订单 |
| POST | /api/orders/:id/pay | 支付订单 |

### 5.6 管理端接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /admin/login | 管理员登录 |
| GET | /admin/products | 商品列表 |
| POST | /admin/products | 新增商品 |
| PUT | /admin/products/:id | 更新商品 |
| DELETE | /admin/products/:id | 删除商品 |
| GET | /admin/orders | 订单列表 |
| PUT | /admin/orders/:id/ship | 发货 |
| GET | /admin/stats | 统计数据 |

---

## 6. 订单状态流转

```
待付款 (0) ──支付──► 待发货 (1) ──发货──► 待收货 (2) ──确认收货──► 已完成 (3)
    │
    └──取消订单──► 已取消 (4)
```

---

## 7. 开发计划

### 第一阶段：基础架构
- 数据库设计与创建
- 后端框架搭建
- 基础配置

### 第二阶段：核心功能
- 用户认证模块
- 商品管理模块
- 订单模块

### 第三阶段：前端开发
- 小程序页面开发
- Web 管理端开发

### 第四阶段：测试优化
- 接口测试
- 性能优化
- 部署上线

---

## 8. 注意事项

1. 微信支付需配置商户号
2. 敏感数据需加密存储
3. 接口需做权限校验
4. 图片需使用 CDN 存储
5. 重要操作需记录日志

---

*文档版本：v1.0*
*最后更新：2026-02-27*
