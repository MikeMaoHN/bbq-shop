/**
 * 订单页逻辑
 */
const api = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    isConfirmMode: false,
    orderItems: [],
    selectedAddress: null,
    remark: '',
    goodsAmount: 0,
    freightAmount: 0,
    totalAmount: 0,
    
    // 订单列表
    orders: [],
    statusFilter: '',
    statusMap: config.orderStatus,
    loading: false,
    hasMore: true,
    page: 1
  },

  onLoad(options) {
    if (options.items) {
      this.setData({ isConfirmMode: true });
      const items = JSON.parse(decodeURIComponent(options.items));
      this.loadOrderItems(items);
      this.loadAddress();
    }
  },

  onShow() {
    if (!this.data.isConfirmMode) {
      this.loadOrders();
    } else if (this.data.selectedAddress) {
      // 重新加载地址（可能用户在地址管理页修改了）
      this.loadAddress();
    }
  },

  async loadOrderItems(items) {
    try {
      // 并发请求所有商品详情，避免串行等待
      const products = await Promise.all(
        items.map(item => api.getProductDetail(item.productId))
      );

      const orderItems = items.map((item, idx) => {
        const product = products[idx];
        let image = '';
        try {
          image = product.images ? JSON.parse(product.images)[0] : '';
        } catch (e) {
          image = '';
        }
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image
        };
      });

      const goodsAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      this.setData({
        orderItems,
        goodsAmount,
        totalAmount: goodsAmount / 100
      });
    } catch (error) {
      console.error('加载商品信息失败:', error);
      wx.showToast({ title: '加载商品信息失败', icon: 'none' });
    }
  },

  async loadAddress() {
    try {
      const addresses = await api.getAddresses();
      const selectedAddress = addresses.find(addr => addr.is_default) || addresses[0] || null;
      this.setData({ selectedAddress });
    } catch (error) {
      console.error('加载地址失败:', error);
    }
  },

  selectAddress() {
    wx.navigateTo({ url: '/pages/profile/profile?selectAddress=1' });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitOrder() {
    if (!this.data.selectedAddress) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' });
      return;
    }

    try {
      const items = this.data.orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const order = await api.createOrder({
        addressId: this.data.selectedAddress.id,
        remark: this.data.remark,
        items
      });

      wx.showModal({
        title: '订单创建成功',
        content: '是否立即支付？',
        success: (res) => {
          if (res.confirm) {
            this.payOrder({ currentTarget: { dataset: { id: order.id } } });
          } else {
            wx.redirectTo({ url: '/pages/order/order' });
          }
        }
      });
    } catch (error) {
      console.error('创建订单失败:', error);
    }
  },

  async payOrder(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      await api.payOrder(id);
      wx.showToast({ title: '支付成功', icon: 'success' });
      this.loadOrders();
    } catch (error) {
      console.error('支付失败:', error);
    }
  },

  async cancelOrder(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '提示',
      content: '确定取消订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.cancelOrder(id, '用户主动取消');
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.loadOrders();
          } catch (error) {
            console.error('取消订单失败:', error);
          }
        }
      }
    });
  },

  async confirmReceipt(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '提示',
      content: '确认已收到商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.confirmReceipt(id);
            wx.showToast({ title: '确认成功', icon: 'success' });
            this.loadOrders();
          } catch (error) {
            console.error('确认收货失败:', error);
          }
        }
      }
    });
  },

  selectStatus(e) {
    const { status } = e.currentTarget.dataset;
    this.setData({
      statusFilter: status,
      orders: [],
      page: 1,
      hasMore: true
    });
    this.loadOrders();
  },

  async loadOrders() {
    if (this.data.loading || !this.data.hasMore || this.data.isConfirmMode) return;

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        limit: 10
      };
      
      if (this.data.statusFilter !== '') {
        params.status = parseInt(this.data.statusFilter);
      }

      const result = await api.getOrders(params);
      
      this.setData({
        orders: this.data.page === 1 ? result.list : [...this.data.orders, ...result.list],
        hasMore: this.data.orders.length + result.list.length < result.total,
        page: this.data.page + 1,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载订单失败:', error);
    }
  },

  onReachBottom() {
    if (!this.data.isConfirmMode) {
      this.loadOrders();
    }
  }
})
