const router = require("express").Router();
const {mysqlClient, sqlAsync} = require("../lib/database/client");
const MAX_ITEMS = 5;

router.get("/", async (req, res, next) => {
  const keyword = req.query.keyword || "";
  let results;

  try {
    if (keyword) {
      await mysqlClient.executeQuery(
        await sqlAsync("SELECT_SHOP_LIST_BY_NAME.sql",[MAX_ITEMS, `%${keyword}%`])
      );
    } else {
      results = await mysqlClient.executeQuery(
        await sqlAsync("SELECT_SHOP_HIGH_SCORE_LIST.sql", [MAX_ITEMS])
      );
    }
  } catch(err) {
    next(err);
  }

  res.render("./search/list.ejs", {results});
});

module.exports = router;