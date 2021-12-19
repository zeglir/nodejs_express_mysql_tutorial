const pool = require("./pool");

const Transaction = class {
  constructor(connection) {
    // connectionを外部から受け取れるようにする
    // 無くても OK
    this.connection = connection;
  }

  async begin() {
    // 外部からconnectionを受け取っていたら一度リリースする
    // その後 poolからあらためて connectionを取得してからトランザクション開始する
    if (this.connection) {
      this.connection.release();
    }
    this.connection = await pool.getConnection();
    this.connection.beginTransaction();
  }

  async executeQuery(query, value, options = {}) {
    options = {
      fields: options.fields || false
    };

    return new Promise((resolve, reject) => {
      // query の第三引数のコールバック関数は、エラー・結果・結果のフィールド情報を含む
      // フィールド情報は options.fields が有効な場合のみ返す
      this.connection.query(query, value, (err, results, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve(options.fields ? {results, fields} : results);
        }
      });
    });
  }

  async commit() {
    return new Promise((resolve, reject) => {
      this.connection.commit((err) => {
        // コネクションをリリースしてメンバ参照も外しておく
        this.connection.release();
        this.connection = null;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async rollback() {
    return new Promise((resolve, reject) => {
      this.connection.rollback((err) => {
        // コネクションをリリースしてメンバ参照も外しておく
        this.connection.release();
        this.connection = null;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

module.exports = Transaction;