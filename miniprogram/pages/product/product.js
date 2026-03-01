/**
 * 商品/购物车页逻辑
 */
const api = require('../../utils/api');

Page({
  data: {
    isCartMode: false,
    cartItems: [],
    allChecked: false,
    checkedCount: 0,
    totalPrice: 0,
    product: {},
    productImages: []
  },

  onLoad(options) {
    if (options.cart) {
      this.setData({ isCartMode: true });
      this.loadCart();
    } else if (options.id) {
      this.loadProduct(options.id);
    }
  },

  async loadCart() {
    try {
      const cart = await api.getCart();
      const items = cart.items || [];
      const allChecked = items.length > 0 && items.every(item => item.checked);
      
      this.setData({
        cartItems: items,
        allChecked
      });
      this.calculateTotal();
    } catch (error) {
      console.error('加载购物车失败:', error);
    }
  },

  async loadProduct(id) {
    try {
      const product = await api.getProductDetail(id);
      const images = product.images ? JSON.parse(product.images) : [];
      
      this.setData({
        product,
        productImages: images.length > 0 ? images : ['/images/default-product.png']
      });
    } catch (error) {
      console.error('加载商品详情失败:', error);
      wx.navigateBack();
    }
  },

  calculateTotal() {
    const { cartItems } = this.data;
    const checkedItems = cartItems.filter(item => item.checked);
    
    this.setData({
      checkedCount: checkedItems.length,
      totalPrice: checkedItems.reduce((sum, item) => sum + item.price * item.quantity, 0) / 100
    });
  },

  toggleCheck(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.cartItems.find(item => item.id === id);
    
    api.updateCartChecked(id, !item.checked).then(() => {
      item.checked = !item.checked;
      this.setData({
        cartItems: [...this.data.cartItems],
        allChecked: this.data.cartItems.every(item => item.checked)
      });
      this.calculateTotal();
    });
  },

  toggleAll() {
    const newChecked = !this.data.allChecked;
    
    api.updateAllChecked(newChecked).then(() => {
      this.data.cartItems.forEach(item => {
        item.checked = newChecked;
      });
      this.setData({
        cartItems: [...this.data.cartItems],
        allChecked: newChecked
      });
      this.calculateTotal();
    });
  },

  increase(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.cartItems.find(item => item.id === id);
    
    if (item.quantity >= item.stock) {
      wx.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
    
    api.updateCartQuantity(id, item.quantity + 1).then(() => {
      item.quantity++;
      this.setData({ cartItems: [...this.data.cartItems] });
      this.calculateTotal();
    });
  },

  decrease(e) {
    const { id } = e.currentTarget.dataset;
    const item = this.data.cartItems.find(item => item.id === id);
    
    if (item.quantity <= 1) {
      this.deleteItem({ currentTarget: { dataset: { id } } });
      return;
    }
    
    api.updateCartQuantity(id, item.quantity - 1).then(() => {
      item.quantity--;
      this.setData({ cartItems: [...this.data.cartItems] });
      this.calculateTotal();
    });
  },

  deleteItem(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          api.deleteCartItem(id).then(() => {
            this.setData({
              cartItems: this.data.cartItems.filter(item => item.id !== id)
            });
            this.calculateTotal();
          });
        }
      }
    });
  },

  clearCart() {
    wx.showModal({
      title: '提示',
      content: '确定清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          api.clearCart().then(() => {
            this.setData({ cartItems: [] });
            this.calculateTotal();
          });
        }
      }
    });
  },

  checkout() {
    if (this.data.checkedCount === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    
    const items = this.data.cartItems.filter(item => item.checked).map(item => ({
      productId: item.product_id,
      quantity: item.quantity
    }));
    
    wx.navigateTo({
      url: `/pages/order/order?items=${encodeURIComponent(JSON.stringify(items))}`
    });
  },

  goShop() {
    wx.switchTab({ url: '/pages/shop/shop' });
  },

  async addToCart() {
    try {
      await api.addToCart(this.data.product.id, 1);
      wx.showToast({ title: '已加入购物车', icon: 'success' });
    } catch (error) {
      console.error('加入购物车失败:', error);
    }
  },

  buyNow() {
    const items = JSON.stringify([{ productId: this.data.product.id, quantity: 1 }]);
    wx.navigateTo({ url: `/pages/order/order?items=${items}` });
  }
})
