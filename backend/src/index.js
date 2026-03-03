/**
 * 应用入口
 */
const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config')
const Logger = require('./utils/logger')
const log = new Logger('Server')

const apiRoutes = require('./routes/index')
const adminRoutes = require('./routes/admin')

const app = express()

// CORS 配置：生产环境通过 CORS_ORIGIN 环境变量指定允许的域名（逗号分隔），开发环境设置 CORS_ORIGIN=* 允许所有
const allowedOrigins = config.cors.origin === '*'
  ? null
  : config.cors.origin.split(',').map(s => s.trim())

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) // 服务端对服务端请求
    if (!allowedOrigins) return callback(null, true) // 允许所有
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS policy: origin ${origin} not allowed`))
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    log.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
  })
  next()
})

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API 路由
app.use('/api', apiRoutes)
app.use('/admin/api', adminRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use((req, res) => {
  log.warn(`404 - ${req.method} ${req.path}`)
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    timestamp: Date.now()
  })
})

// 全局错误处理
app.use((err, req, res, next) => {
  log.error('全局错误:', err.message)
  log.error('错误堆栈:', err.stack)
  res.status(500).json({
    code: 500,
    message: err.message || '服务器错误',
    timestamp: Date.now()
  })
})

// 启动服务
const server = app.listen(config.port, () => {
  log.info('╔════════════════════════════════════════════╗')
  log.info('║         烧烤食材售卖系统 - 后端服务          ║')
  log.info('╠════════════════════════════════════════════╣')
  log.info(`║  运行环境：${config.nodeEnv.padEnd(20)}║`)
  log.info(`║  服务端口：${String(config.port).padEnd(20)}║`)
  log.info(`║  启动时间：${new Date().toLocaleString('zh-CN').padEnd(14)}║`)
  log.info('╚════════════════════════════════════════════╝')
  log.info('服务已启动，等待请求...')
  log.info('日志文件：logs/app.log')
})

// 优雅关闭
process.on('SIGTERM', () => {
  log.info('收到 SIGTERM 信号，正在关闭服务...')
  server.close(() => {
    log.info('服务已关闭')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  log.info('收到 SIGINT 信号，正在关闭服务...')
  server.close(() => {
    log.info('服务已关闭')
    process.exit(0)
  })
})

module.exports = app
