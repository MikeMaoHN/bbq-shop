/**
 * 全局配置
 * 只需修改 HOST 为实际服务器地址，baseUrl 和 imageBase 自动更新
 */

// 服务器地址：开发时填写局域网 IP，生产时替换为正式域名
const HOST = 'http://10.0.96.252:3000'

module.exports = {
  // API 基础地址
  baseUrl: HOST + '/api',

  // 图片地址前缀
  imageBase: HOST,

  // 订单状态映射
  orderStatus: {
    0: '待付款',
    1: '待发货',
    2: '待收货',
    3: '已完成',
    4: '已取消'
  }
}
