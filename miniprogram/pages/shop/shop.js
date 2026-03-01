/**
 * 商城页逻辑
 */
const api = require('../../utils/api');

Page({
  data: {
    categories: [],
    products: [],
    categoryId: '',
    searchKeyword: '',
    loading: false,
    hasMore: true,
    page: 1,
    cartCount: 0
  },

  onLoad(options) {
    if (options.categoryId) {
      this.setData({ categoryId: options.categoryId });
    }
    this.loadCategories();
    this.loadProducts();
  },

  onShow() {
    this.loadCartCount();
  },

  async loadCategories() {
    try {
      const categories = await api.getCategories();
      this.setData({ categories });
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  },

  async loadProducts() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        limit: 20
      };
      
      if (this.data.categoryId) {
        params.categoryId = this.data.categoryId;
      }
      
      if (this.data.searchKeyword) {
        params.keyword = this.data.searchKeyword;
      }

      const result = await api.getProducts(params);
      
      this.setData({
        products: this.data.page === 1 ? result.list : [...this.data.products, ...result.list],
        hasMore: this.data.products.length + result.list.length < result.total,
        page: this.data.page + 1,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载商品失败:', error);
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.loadProducts();
  },

  doSearch() {
    this.setData({
      products: [],
      page: 1,
      hasMore: true,
      categoryId: ''
    });
    this.loadProducts();
  },

  async loadCartCount() {
    try {
      const cart = await api.getCart();
      this.setData({
        cartCount: cart.items.filter(item => item.checked).length
      });
    } catch (error) {
      console.error('加载购物车失败:', error);
    }
  },

  selectCategory(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      categoryId: id === '' ? '' : id,
      searchKeyword: '',
      products: [],
      page: 1,
      hasMore: true
    });
    this.loadProducts();
  },

  goProduct(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/product/product?id=${id}` });
  },

  async addToCart(e) {
    e.stopPropagation();
    const { id } = e.currentTarget.dataset;
    
    try {
      await api.addToCart(id, 1);
      wx.showToast({ title: '已加入购物车', icon: 'success' });
      this.loadCartCount();
    } catch (error) {
      console.error('加入购物车失败:', error);
    }
  },

  goCart() {
    wx.navigateTo({ url: '/pages/product/product?cart=1' });
  },

  onReachBottom() {
    this.loadProducts();
  }
})
