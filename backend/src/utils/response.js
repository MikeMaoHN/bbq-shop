/**
 * 统一响应格式
 */
class Response {
  static success(data = null, message = 'success', code = 200) {
    return {
      code,
      message,
      data,
      timestamp: Date.now()
    };
  }

  static error(message = 'error', code = 400, data = null) {
    return {
      code,
      message,
      data,
      timestamp: Date.now()
    };
  }
}

module.exports = Response;
