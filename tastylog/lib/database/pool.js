const {promisify} = require("util");
const mysql = require("mysql");
const config = require("../../config/mysql.config");
const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  connectionLimit: config.connectionLimit,
  queueLimit: config.queueLimit
});

module.exports = {
  // Pool オブジェクトのメソッドを Promisifyで Promise化する
  // いずれも、本来の this（Connectionのインスタンス）が必要になるため、
  // bindで明示的に thisを束縛する
  // ※Promisifyを適用した関数には 本来のthisが紐づいていない
  pool,
  getConnection: promisify(pool.getConnection).bind(pool),
  poolQuery: promisify(pool.query).bind(pool),
  release: function(connection) {
    return connection.release();
  },
  end: promisify(pool.end).bind(pool)
};