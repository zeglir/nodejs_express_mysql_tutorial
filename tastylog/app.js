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
// テストコード
app.use("/test", async (req, res, next) => {
  const path = require("path");
  const {promisify} = require("util");
  const mysql = require("mysql");
  const config = require("./config/mysql.config");
  const {sql} = require("./lib/util/mysql-fileloader")({ root: path.join(__dirname, "./lib/database/sql") });
  const conn = mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database
  });

  const client = {
    connect: promisify(conn.connect).bind(conn),
    query: promisify(conn.query).bind(conn),
    end: promisify(conn.end).bind(conn)
  };

  try {
    await client.connect();
    const data = await client.query(await sql("SELECT_SHOP_BASIC_BY_ID.sql"));
    console.log(data);
  } catch (error) {
    next(error);
  } finally {
    await client.end();
  }

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

