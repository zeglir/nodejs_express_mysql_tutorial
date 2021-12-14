const path = require("path");
const {sqlAsync} = require("../util/mysql-fileloader")({ root: path.join(__dirname, "./sql") });
const {poolQuery} = require("./pool");

const mysqlClient = {
  executeQuery: function(query, value) {
    // poolQueryの実体は Poolオブジェクトの query なので、
    // pool.getConnection -> conn.query -> conn.release までまとめて実行してくれる
    // 
    // poolQuery自体はPromise化されているので、
    // return されているのは、query の実行結果ではなく Promiseオブジェクトなことに注意
    // ※thenや await を指定したところで実行される
    return poolQuery(query, value);
  }
};

module.exports = {
  mysqlClient,
  sqlAsync
};