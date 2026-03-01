/**
 * 首页逻辑
 */
const api = require('../../utils/api');

Page({
  data: {
    banners: [
      { id: 1, image: '/images/banner1.png' },
      { id: 2, image: '/images/banner2.png' },
      { id: 3, image: '/images/banner3.png' }
    ],
    categories: [],
    hotProducts: [],
    loading: false
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData() {
    this.setData({ loading: true });
    
    try {
      const [categories, hotProducts] = await Promise.all([
        api.getCategories(),
        api.getProducts({ isHot: '1', limit: 8 })
      ]);
      
      this.setData({
        categories,
        hotProducts: hotProducts.list
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/shop/shop?search=1' });
  },

  goCategory(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/shop/shop?categoryId=${id}` });
  },

  goProduct(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/product/product?id=${id}` });
  }
})
