const router = require("express").Router();
const {mysqlClient, sqlAsync} = require("../lib/database/client");

router.get("/:id", async (req, res, next) => {
  const id = req.params.id;

  Promise.all([
    // 店舗情報の取得
    mysqlClient.executeQuery(await sqlAsync("SELECT_SHOP_DETAIL_BY_ID.sql"), [id]),
    // 店舗レビューの取得
    mysqlClient.executeQuery(await sqlAsync("SELECT_SHOP_REVIEW_BY_SHOP_ID.sql"), [id])
  ]).then((results) => {
    const data = results[0][0];
    // 結果を合成（店舗レビュー)
    // undefinedにならないようにレビューが無ければカラ配列を設定
    data.reviews = results[1] || [];
    res.render("./shops/index", data);
  }).catch((err) => {
    next(err);
  });

});

module.exports = router;