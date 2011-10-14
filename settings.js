exports.db = 'localhost:27017/doer?auto_reconnect';
exports.secret = 'doers.me?cool!';
exports.google = {
    clientId: '402025418712.apps.googleusercontent.com'
    ,clientSecret: 'nEvNLEuLqTGo3h_MnhsMYlon'
    ,redirectUrl: 'http://doers.me/auth/google/callback'
};
exports.serverPort = 80;

// 开发环境配置
if (process.env.NODE_ENV != 'production') {
    exports.debug = true;
    exports.google.redirectUrl = 'http://localhost:10086/auth/google/callback';
    exports.serverPort = 10086;
}
