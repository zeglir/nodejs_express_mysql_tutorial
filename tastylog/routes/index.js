const router = require("express").Router();

// モジュール側の第一引数のパスは組み込み先からの相対パスになる
router.get("/", (req, res) => {
  // views 配下のejsテンプレートを出力する
  // 第一引数のパスは、viewsフォルダからの相対パス指定になる
  // 拡張子（ejs）は省略可能
  res.render("./index");
});

module.exports = router;