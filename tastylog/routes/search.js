const router = require("express").Router();
const {mysqlClient, sqlAsync} = require("../lib/database/client");
const MAX_ITEMS_PER_PAGE = require("../config/application.config").search.MAX_ITEMS_PER_PAGE;

router.get("/", async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const page = req.query.page ? parseInt(req.query.page) : 1;
  let count, results;

  try {
    // 検索キーワードが指定された場合はスコア順の上位検索
    // キーワードがある場合は、キーワードを含むなかでスコア順の上位検索
    if (keyword) {
      count = (await mysqlClient.executeQuery(
        await sqlAsync("COUNT_SHOP_BY_NAME.sql"), [`%${keyword}%`]
      ))[0].count;

      const startIndex = (page - 1) * MAX_ITEMS_PER_PAGE + 1;
      const endIndex = startIndex + MAX_ITEMS_PER_PAGE - 1;
      results = await mysqlClient.executeQuery(
        await sqlAsync("SELECT_SHOP_LIST_BY_NAME.sql"), [`%${keyword}%`, startIndex, endIndex]
      );
    } else {
      // デフォルト検索の場合、総件数は固定とする
      count = MAX_ITEMS_PER_PAGE;
      results = await mysqlClient.executeQuery(
        await sqlAsync("SELECT_SHOP_HIGH_SCORE_LIST.sql"), [MAX_ITEMS_PER_PAGE]
      );
    }
  } catch(err) {
    next(err);
  }

  res.render("./search/list.ejs", {
    keyword,
    count,
    results,
    pagination: {
      max: Math.ceil(count / MAX_ITEMS_PER_PAGE),
      cur: page
    }
  });
});

module.exports = router;