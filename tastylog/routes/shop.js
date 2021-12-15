const router = require("express").Router();
const {mysqlClient, sqlAsync} = require("../lib/database/client");

router.get("/:id", async (req, res, next) => {
  const id = req.params.id;

  Promise.all([
    mysqlClient.executeQuery(await sqlAsync("SELECT_SHOP_DETAIL_BY_ID.sql"), [id])
  ]).then((results) => {
    const data = results[0][0];
    res.render("./shops/index", data);
  }).catch((err) => {
    next(err);
  });

});

module.exports = router;