const router = require("express").Router();
const csrf = require("csurf");
const moment = require("moment");
const {mysqlClient, sqlAsync} = require("../lib/database/client");
const DATE_FORMAT = "YYYY/MM/DD";

// CSRF対策用
// これより前で POST(form)の処理, cookie, sessionの利用などが有効になっていること
//
// cookie: falseの場合は sessionに csrf の secret が保存される。
// trueにすると cookieに保存されて、この場合は二重送信クッキー（Double Submit Cookie）の対策パターンになる
const csrfProtect = csrf({cookie: false});
// ここのルーティング（/account/reviews/～）すべてで CSRFトークンチェックを有効にする
// デフォルトで GET,HEAD,OPTIONSではトークンチェックがかからないため、
// 初期画面をGETで取得（トークンチェックなし） → req.csrfToken()でトークン生成・ビューに返却
// ビューのhiddenにトークンを埋め込んで、次のPOSTでSubmit を繰り返す。
// これにより、トークンを保存する hiddenを form内に用意すれば、
// 正しい前画面からの遷移かどうかをcsurfがチェックしてくれる
router.use(csrfProtect);

function validateReviewData(req) {
  const body = req.body;
  let isValid = true;
  let error = {};

  // 訪問日のチェック
  if (body.visit && !moment(body.visit, DATE_FORMAT).isValid()) {
    error.visit = "訪問日は YYYY/MM/DD 形式で入力してください";
    isValid = false;
  }

  return isValid ? undefined : error;
}

function createReviewData(req) {
  const wrapD = moment(req.body.visit, DATE_FORMAT);
  const sc = Number.parseFloat(req.body.score);
  return {
    shopId: req.body.shopId,
    visit: wrapD.isValid() ? wrapD.toDate() : null,
    visitDisp: wrapD.isValid ? req.body.visit : "", // 表示用
    score: Number.isNaN(sc) ? 0 : sc,
    post: new Date(),
    description: req.body.description
  };
}

// 口コミの登録画面 初期表示(GET)
router.get("/regist/:shopId(\\d+)", async (req, res, next) => {
  const shopId = req.params.shopId;
  let results, shop, shopName, review;

  try {
    results = await mysqlClient.executeQuery(await sqlAsync("SELECT_SHOP_BASIC_BY_ID.sql"), [shopId]);
    shop = results[0] || {};
    shopName = shop.name;
    review = {};
    res.render("./account/reviews/regist-form.ejs", {csrfToken: req.csrfToken(), shopId, shopName, review});
  } catch(err) {
    next(err);
  }
});

// 口コミの登録確認画面 確認画面からの再表示(POST)
router.post("/regist/:shopId(\\d+)", (req, res, next) => {
  const review = createReviewData(req);
  const {shopId, shopName} = req.body;
  res.render("./account/reviews/regist-form", {csrfToken: req.csrfToken(), shopId, shopName, review});
});

// 口コミの登録確認画面 初期表示
router.post("/regist/confirm", (req, res, next) => {
  const error = validateReviewData(req);
  const review = createReviewData(req);
  const {shopId, shopName} = req.body;

  if (error) {
    // チェックエラーがある場合
    res.render("./account/reviews/regist-form", {csrfToken: req.csrfToken(), error, shopId, shopName, review});
  } else {
    res.render("./account/reviews/regist-confirm", {csrfToken: req.csrfToken(), shopId, shopName, review});
  }
});

// 口コミの登録実行画面
router.post("/regist/execute", async (req, res, next) => {
  const error = validateReviewData(req);
  const review = createReviewData(req);
  const {shopId, shopName} = req.body;
  const userId = 1; // Todo ログイン機能実装後に追加

  let tran;

  if (error) {
    // チェックエラーがある場合
    res.render("./account/reviews/regist-form", {csrfToken: req.csrfToken(), error, shopId, shopName, review});
    return;
  }

  try {
    // トランザクション開始
    tran = await mysqlClient.beginTransaction();
    // t_shopの行ロック取得
    await tran.executeQuery(await sqlAsync("SELECT_SHOP_BY_ID_FOR_UPDATE"), [shopId]);
    // t_reviewの登録
    await tran.executeQuery(await sqlAsync("INSERT_SHOP_REVIEW"), [
      shopId, userId, review.score, review.visit, review.description
    ]);
    // t_shopの平均スコア更新
    await tran.executeQuery(await sqlAsync("UPDATE_SHOP_SCORE_BY_ID"), [shopId, shopId]);
    await tran.commit();

    // csrf({cookie: false}) の場合
    // sessionのプロパティから csurf の secretを削除する
    delete req.session.csrfSecret;
    // csrf({cookie: true}) の場合
    // cookieから csurf の secretを削除する
    res.clearCookie("_csrf");

    // 完了画面にリダイレクト（PRGパターン）
    res.redirect(`/account/reviews/regist/complete?shopId=${shopId}`);
  } catch(err) {
    await tran.rollback();
    next(err);
  }

  // 口コミの登録完了画面
  router.get("/regist/complete", (req, res, next) => {
    res.render("./account/reviews/regist-complete", {shopId: req.query.shopId});
  });
});

module.exports = router;