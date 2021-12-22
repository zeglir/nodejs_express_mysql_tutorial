const router = require("express").Router();
const moment = require("moment");
const {mysqlClient, sqlAsync} = require("../lib/database/client");
const DATE_FORMAT = "YYYY/MM/DD";

function createReviewData(req) {
  const wrapD = moment(req.body.visit, DATE_FORMAT);
  const sc = Number.parseFloat(req.body.score);
  return {
    shopId: req.body.shopId,
    visit: wrapD.isValid() ? wrapD.toDate() : null,
    visitDisp: wrapD.isValid ? req.body.visit : "",
    score: Number.isNaN(sc) ? 0 : sc,
    post: new Date(),
    description: req.body.description
  };
}

// 口コミの登録画面 初期表示
router.get("/regist/:shopId(\\d+)", async (req, res, next) => {
  const shopId = req.params.shopId;
  let results, shop, shopName, review;

  try {
    results = await mysqlClient.executeQuery(await sqlAsync("SELECT_SHOP_BASIC_BY_ID.sql"), [shopId]);
    shop = results[0] || {};
    shopName = shop.name;
    review = {};
    res.render("./account/reviews/regist-form.ejs", {shopId, shopName, review});
  } catch(err) {
    next(err);
  }
});

// 口コミの登録確認画面 初期表示
router.post("/regist/confirm", (req, res, next) => {
  const review = createReviewData(req);
  const {shopId, shopName} = req.body;
  res.render("./account/reviews/regist-confirm", {shopId, shopName, review});
});

module.exports = router;