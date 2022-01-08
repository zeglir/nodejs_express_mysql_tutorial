const router = require("express").Router();
const {authenticate, authorize, PRIVILEGE} = require("../lib/security/accesscontrol");

// 会員画面
// 認可チェックが行われる
router.get("/", authorize(PRIVILEGE.NORMAL), (req, res, next) => {
  res.render("./account/index");
});

// ログイン画面（GET）
// 初期表示や認証エラー時などの戻り時
router.get("/login", (req, res, next) => {
  res.render("./account/login", {message: req.flash("error")});
});

// ログイン画面（POST）
// ログインボタンが押下された場合
router.post("/login", authenticate());

// ログアウト処理
router.post("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/account/login");
});

// 口コミ登録系画面（登録・確認・完了）
// 認可チェックが行われる
router.use("/reviews", authorize(PRIVILEGE.NORMAL), require("./account.reviews"));

module.exports = router;