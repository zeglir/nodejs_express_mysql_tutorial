const port = process.env.PORT;
const path = require("path");
const favicon = require("serve-favicon");
const express = require("express");
const app = express();

// Hello World 動作確認用
// app.get("/", (req, res) => {
//   res.end("Hello World!");
// });

// Expressで ejsを使う設定（おまじない）
app.set("view engine", "ejs");

// Expressで静的コンテンツ配信の設定
// faviconを serve-faviconで配信
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
// publicフォルダ配下を /public として公開する
// 先頭のパス指定は省略可能で、その場合は "/" を指定した場合と同じになる
app.use("/public", express.static(path.join(__dirname, "public")));

// Expressで動的コンテンツ配信の設定
// モジュール形式の route handler を使用
app.use("/", require("./routes/index"));

// アプリケーションを指定ポートで起動
app.listen(port, () => {
  console.log(`Application listening on port:${port}`);
});

