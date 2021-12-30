const router = require("express").Router();
const {authenticate} = require("../lib/security/accesscontrol");

router.get("/login", (req, res, next) => {
  res.render("./account/login", {message: req.flash("error")});
});

router.post("/login", authenticate());

router.use("/reviews", require("./account.reviews"));

module.exports = router;