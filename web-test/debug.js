// 调试脚本
window.addEventListener('DOMContentLoaded', function() {
  console.log('页面加载完成');
  
  // 测试函数是否存在
  console.log('showAddAddressFromCheckout:', typeof window.showAddAddressFromCheckout);
  console.log('showAddAddress:', typeof window.showAddAddress);
  
  // 添加全局错误监听
  window.onerror = function(msg, url, line) {
    console.error('全局错误:', msg, 'Line:', line);
  };
});
