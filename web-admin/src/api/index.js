import request from '@/utils/request'

export default {
  // 登录
  login(data) {
    return request.post('/login', data)
  },

  // 管理员信息
  getInfo() {
    return request.get('/admin/info')
  },

  // 分类
  getCategories(params) {
    return request.get('/categories', { params })
  },
  getCategory(id) {
    return request.get(`/categories/${id}`)
  },
  createCategory(data) {
    return request.post('/categories', data)
  },
  updateCategory(id, data) {
    return request.put(`/categories/${id}`, data)
  },
  deleteCategory(id) {
    return request.delete(`/categories/${id}`)
  },

  // 商品
  getProducts(params) {
    return request.get('/products', { params })
  },
  getProduct(id) {
    return request.get(`/products/${id}`)
  },
  createProduct(data) {
    return request.post('/products', data)
  },
  updateProduct(id, data) {
    return request.put(`/products/${id}`, data)
  },
  deleteProduct(id) {
    return request.delete(`/products/${id}`)
  },
  updateProductStock(id, data) {
    return request.put(`/products/${id}/stock`, data)
  },

  // 库存
  getStockProducts(params) {
    return request.get('/stock/products', { params })
  },
  getStockLogs(params) {
    return request.get('/stock/logs', { params })
  },

  // 订单
  getOrders(params) {
    return request.get('/orders', { params })
  },
  getOrder(id) {
    return request.get(`/orders/${id}`)
  },
  shipOrder(id, data) {
    return request.put(`/orders/${id}/ship`, data)
  },
  updateOrderRemark(id, data) {
    return request.put(`/orders/${id}/remark`, data)
  },

  // 统计
  getStats(params) {
    return request.get('/stats', { params })
  },
  getLowStockProducts(params) {
    return request.get('/stats/low-stock', { params })
  },

  // 上传
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
