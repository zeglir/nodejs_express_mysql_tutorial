const IS_PRODUCTION = process.env.NODE_ENV === "production";
const appconfig = require("./config/application.config");
const dbconfig = require("./config/mysql.config");
const path = require("path");
const logger = require("./lib/log/logger");
const expressMWappLogger = require("./lib/log/expressMWappLogger");
const expressMWaccessLogger = require("./lib/log/expressMWaccessLogger");
const accesscontrol = require("./lib/security/accesscontrol");
const favicon = require("serve-favicon");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const flash = require("connect-flash");
const gracefulShutdown = require("http-graceful-shutdown");
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

// EJSにグローバルメソッドを公開する
app.use((req, res, next) => {
  res.locals.moment = require("moment");
  res.locals.padding = require("./lib/math/math").padding;
  res.locals.round = require("./lib/math/math").round;
  next();
});

// Expressで静的コンテンツ配信の設定
// faviconを serve-faviconで配信
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
// publicフォルダ配下を /public として公開する
// 先頭のパス指定は省略可能で、その場合は "/" を指定した場合と同じになる
app.use("/public", express.static(path.join(__dirname, "public")));

// Expressで動的コンテンツ配信の設定
// アクセスログを有効にする
app.use(expressMWaccessLogger());

// ExpressでPOSTされたformの解析を有効にする
// optionの extended が trueの場合、解析に qsライブラリを使う
// falseにすると、querystringライブラリを使う
// ※デフォルト値が true なので明示しなくてもよいはず
app.use(express.urlencoded({extended: true}));
// cookie-parserを有効にする
app.use(cookieParser());
// sessionを有効にする
// cookieを使うので、cookie設定の後で行う
app.use(session({
  store: new MySQLStore({
    host: dbconfig.host,
    port: dbconfig.port,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database
  }),
  cookie: {
    // 本番環境ならば cookieの secure属性を true にする
    secure: IS_PRODUCTION
  },
  secret: appconfig.security.SECRET_KEY,
  // sessionに変更がない場合に強制的に保存するかどうか。デフォルトtrueだがfalse推奨
  resave: false, 
  // 生成しただけで未変更のsessionを保存するかどうか。デフォルトtrueだがfalse推奨
  // trueの場合、サイトを訪問した時点で自動で cookieが発行されるので、
  // cookie利用に関する法（改正個人情報保護法やGDPRなど）との兼ね合いに注意が必要
  saveUninitialized: false, 
  name: "sid"
}));
// connect-flashを有効にする
// sessionを使うので、session設定の後で行う
app.use(flash());
// passport関連の初期化をまとめて行う
// initializeで必要なミドルウェアを配列でまとめて返して、スプレッド構文...で展開して指定する
app.use(...accesscontrol.initialize());

// cookieテストのミドルウェアコード
app.use((req, res, next) => {
  console.log(req.cookies.message);
  res.cookie("message", "Hello World");
  next();
});

// 動的コンテンツ配信の設定
const preDynamicRouting = (req, res, next) => {
  // クリックジャッキング対策
  // カスタムヘッダで X-Frame-Options: SAMEORIGIN を設定する
  res.set("X-Frame-Options", "SAMEORIGIN");
  next();
};
app.use("/account", preDynamicRouting, require("./routes/account"));
app.use("/search", preDynamicRouting, require("./routes/search"));
app.use("/shops", preDynamicRouting, require("./routes/shop"));
app.use("/", preDynamicRouting, require("./routes/index"));

// mysql使用のミドルウェアテストコード
app.get("/test", async (req, res, next) => {
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

// トランザクション実行のミドルウェアテストコード
app.get("/trantest", async (req, res, next) => {
  const {mysqlClient} = require("./lib/database/client");
  let tran;
  try {
    tran = await mysqlClient.beginTransaction();
    await tran.executeQuery("UPDATE t_shop SET score = ? WHERE id = ?", [3.92, 1]);
    await tran.commit();
    res.end("OK");
  } catch(err) {
    await tran.rollback();
    next(err);
  }
});

// Expressミドルウェアとしてアプリケーションロガーを設定
// エラー捕捉するので最後に配置
app.use(expressMWappLogger());

// 404エラーの処理
app.use((req, res, next) => {
  res.status(404);
  res.render("./error/404");
});

// 500エラーの処理
app.use((err, req, res, next) => {
  // ミドルウェア設置ロガーより後ろに配置しているので、ロガーを直接使ってエラーログ出力
  logger.appLogger.error(err);

  res.status(500);
  res.render("./error/500");
});

// アプリケーションを指定ポートで起動
// 返り値は http.Serverオブジェクトで、この後のグレースフルシャットダウンで使用する
const server = app.listen(appconfig.port, () => {
  // ロガーで直接出力
  // logger.defaultLogger.info(`Application listening on port:${port}`);
  logger.appLogger.info(`Application listening on port:${appconfig.port}`);
  logger.appLogger.info(`server process id:${process.pid}`);
});

// http-graceful-shutdown の onShutdown時のコールバック
// Promiseを返す必要があるので async関数に
async function shutdown() {
  try {
    // コネクションプールの終了
    const pool_end = require("./lib/database/pool").end;
    await pool_end();
    console.log("connection pool closed");

    // log4jsの終了
    const log4js_shutdown = require("./lib/log/logger").shutdown;
    await log4js_shutdown();
    console.log("log4js shutdown");
  } catch(err) {
    console.log("error occured in graceful shutdown");
    throw err;
  }
}

// グレースフルシャットダウン
// Windowsではシグナルの送信がサポートされないため、
// 別のNode.jsプログラムから process.kill(pid, "SIGINT") などを送っても、
// 送られたプロセスが単純に強制終了する（シグナルの受信→グレースフルシャットダウンにならない）
//
// Windowsでは Ctrl+C が押下された場合のみ、
// 特別に SIGINTに対応するハンドラが動いてグレースフルシャットダウンが動作する模様
// http-graceful-shutdownのDEBUGモードで動かしてみると、SIGINTをトリガーに動作していることがわかる
gracefulShutdown(server, {
  signals: "SIGINT SIGTERM",
  timeout: 10000,
  onShutdown: shutdown,
  finally: () => {
    console.log("server shutdown");
  }
});
