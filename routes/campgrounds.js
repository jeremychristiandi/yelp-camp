const express = require("express");
const router = express.Router();
const catchAsync = require("../helper/catchAsync");
const Campground = require("../models/campground");
const campgroundController = require("../controllers/CampgroundController");
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary"); // node automatically look for index.js
const upload = multer({ storage });

// Grouping similar routes together
router
  .route("/")
  .get(catchAsync(campgroundController.index))
  .post(
    isLoggedIn,
    upload.array("image"),
    validateCampground,
    catchAsync(campgroundController.createCampground)
  );

// '/campgrounds/new' gaboleh di bawah /:id -> bakal ke overwrite
router.get("/new", isLoggedIn, campgroundController.renderNewForm);

router
  .route("/:id")
  .get(catchAsync(campgroundController.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("image"),
    validateCampground,
    catchAsync(campgroundController.updateCampground)
  )
  .delete(
    isLoggedIn,
    isAuthor,
    catchAsync(campgroundController.deleteCampground)
  );

// req.body -> ngambil semua yg di insert sama user dari 'campgrounds/new'

router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgroundController.renderEditForm)
);

module.exports = router;
