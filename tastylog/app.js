const appconfig = require("./config/application.config");
const dbconfig = require("./config/mysql.config");
const path = require("path");
const logger = require("./lib/log/logger");
const expressMWappLogger = require("./lib/log/expressMWappLogger");
const expressMWaccessLogger = require("./lib/log/expressMWaccessLogger");
const favicon = require("serve-favicon");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
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
  secret: appconfig.security.SECRET_KEY,
  resave: false, // sessionに変更がない場合に強制的に保存するかどうか。デフォルトtrueだがfalse推奨
  saveUninitialized: true, // 生成しただけで未修整のsessionを保存するかどうか
  name: "sid"
}));

// cookieテストのミドルウェアコード
app.use((req, res, next) => {
  console.log(req.cookies.message);
  res.cookie("message", "Hello World");
  next();
});

// モジュール形式の route handler を使用
app.use("/account", require("./routes/account"));
app.use("/search", require("./routes/search"));
app.use("/shops", require("./routes/shop"));
app.use("/", require("./routes/index"));

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

// アプリケーションを指定ポートで起動
app.listen(appconfig.port, () => {
  // ロガーで直接出力
  // logger.defaultLogger.info(`Application listening on port:${port}`);
  logger.appLogger.info(`Application listening on port:${appconfig.port}`);
});

