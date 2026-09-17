const express = require("express");
const listingController = require("../controllers/listingController");
const upload = require("../middleware/multer-middleware");
const { optionalAuth, protect } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(optionalAuth, listingController.getAllListings)
  .post(protect, upload.single("imageUrl"), listingController.createListing);

router
  .route("/:id")
  .get(optionalAuth, listingController.getListing)
  .patch(protect, upload.single("imageUrl"), listingController.updateListing)
  .delete(protect, listingController.deleteListing);

router.post("/:id/buy", protect, listingController.buyListing);

module.exports = router;
