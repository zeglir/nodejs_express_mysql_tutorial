const log4js = require("log4js");
const config = require("../../config/log4js.config");

log4js.configure(config);
// console logger
const defaultLogger = log4js.getLogger(); // 引数なしは defaultカテゴリの指定

// application logger
const appLogger = log4js.getLogger("application");

// access logger
const accessLogger = log4js.getLogger("access");

module.exports = {
  defaultLogger,
  appLogger,
  accessLogger
};