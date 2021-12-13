const log4js = require("log4js");
const {accessLogger} = require("./logger");
const LOG_LEVEL_AUTO = "auto";

module.exports = function(options) {
  // 引数チェック
  options = options || { };
  // ログレベル指定が無ければ auto を指定
  options.level = options.level || LOG_LEVEL_AUTO;

  // log4js の connectLogger は Expressミドルウェア関数を返す
  return log4js.connectLogger(accessLogger, options);
};