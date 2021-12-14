const port = process.env.PORT;
const path = require("path");
const logger = require("./lib/log/logger");
const expressMWappLogger = require("./lib/log/expressMWappLogger");
const expressMWaccessLogger = require("./lib/log/expressMWaccessLogger");
const favicon = require("serve-favicon");
const express = require("express");
const app = express();

// Hello World 動作確認用
// app.get("/", (req, res) => {
//   res.end("Hello World!");
// });

// Expressで ejsを使う設定（おまじない）
app.set("view engine", "ejs");
// レスポンスヘッダに x-powered-by: Express を出力しない
app.disable("x-powered-by");

// Expressで静的コンテンツ配信の設定
// faviconを serve-faviconで配信
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
// publicフォルダ配下を /public として公開する
// 先頭のパス指定は省略可能で、その場合は "/" を指定した場合と同じになる
app.use("/public", express.static(path.join(__dirname, "public")));

// Expressで動的コンテンツ配信の設定
// アクセスログを有効にする
app.use(expressMWaccessLogger());
// モジュール形式の route handler を使用
app.use("/", require("./routes/index"));
// mysql使用のミドルウェアテストコード
app.use("/test", async (req, res, next) => {
  const {mysqlClient, sqlAsync} = require("./lib/database/client");

  try {
    // await mysqlClient.connect();
    // const data = await mysqlClient.query(await sqlAsync("SELECT_SHOP_BASIC_BY_ID.sql"), [1]);
    const data = await mysqlClient.executeQuery(await sqlAsync("SELECT_SHOP_BASIC_BY_ID.sql"), [1]);
    // console.log(data);
    console.log(data);
  } catch (error) {
    // エラーの場合は中断して次の処理に引き渡す
    next(error);
  } finally {
    // Connectionは必ずクローズ
    // await mysqlClient.end();
  }
  // リクエストレスポンスサイクルを終了
  res.end("OK");
});

// Expressミドルウェアとしてアプリケーションロガーを設定
// エラー捕捉するので最後に配置
app.use(expressMWappLogger());

// アプリケーションを指定ポートで起動
app.listen(port, () => {
  // ロガーで直接出力
  // logger.defaultLogger.info(`Application listening on port:${port}`);
  logger.appLogger.info(`Application listening on port:${port}`);
});

