const express = require("express");
const listingController = require("../controllers/listingController");
const upload = require("../middleware/multer-middleware");

const router = express.Router();

router
  .route("/")
  .get(listingController.getAllListings)
  .post(upload.single("imageUrl"), listingController.createListing);

router
  .route("/:id")
  .get(listingController.getListing)
  .patch(upload.single("imageUrl"), listingController.updateListing)
  .delete(listingController.deleteListing);

module.exports = router;
