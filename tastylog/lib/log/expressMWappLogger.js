const {appLogger} = require("./logger");

// アプリケーションの処理で例外が発生した場合のログ出力用
// Expressのミドルウェア関数（エラー処理用：4引数）として作成して返却する
module.exports = function(options) {
  return function(err, req, res, next) {
    // Errorオブジェクトを渡すとスタックトレース部分も表示される
    appLogger.error(err);
    // ミドルウェア関数がリクエストレスポンスサイクルを終了しない場合は、
    // next() を呼び出して、次のミドルウェア関数に制御を渡す必要がある。
    // そうしないと、リクエストはハングしたままになる
    next(err);
  };
};
