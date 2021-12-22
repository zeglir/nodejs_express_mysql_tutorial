const router = require("express").Router();

router.use("/reviews", require("./account.reviews"));

module.exports = router;