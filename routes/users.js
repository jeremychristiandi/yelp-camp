const User = require("../models/user");
const userController = require("../controllers/UserController");
const express = require("express");
const router = express.Router();
const catchAsync = require("../helper/catchAsync");
const passport = require("passport");

// re-structure our router
router
  .route("/register")
  .get(userController.renderRegister)
  .post(catchAsync(userController.register));

router
  .route("/login")
  .get(userController.renderLogin)
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    userController.login
  );

router.get("/logout", userController.logout);

// router.get("/logout", async (req, res, next) => {
//   req.logout(function (err) {
//     if (err) {
//       return next(err);
//     }
//     req.flash("success", "Successfully logout!");
//     res.redirect("/campgrounds");
//   });
// });

module.exports = router;
