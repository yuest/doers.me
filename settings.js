exports.db = 'localhost:27017/doer?auto_reconnect';
exports.secret = 'doers.me?cool!';

// 生产环境配置
if (process.env.NODE_ENV != 'production') {
    exports.debug = true;
}
