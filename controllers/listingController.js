const Listing = require("../models/Listing");
const User = require("../models/User");
const deleteUploadedFile = require("../utils/delete-uploaded-file");

// GET /api/v1/listings
// Supports optional filtering: /api/v1/listings?category=books&status=available&user=...&myListings=true
exports.getAllListings = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) filter.category = req.query.category.toLowerCase();
    if (req.query.status) filter.status = req.query.status.toLowerCase();
    if (req.query.user) filter.user = req.query.user;
    if (req.query.myListings === "true" && req.user) {
      filter.user = req.user._id;
    }

    const listings = await Listing.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: listings.length,
      data: {
        listings,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/listings/:id
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        status: "fail",
        message: "Listing not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        listing,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/listings
exports.createListing = async (req, res) => {
  try {
    const category = req.body.category?.toLowerCase();
    const condition = req.body.condition?.toLowerCase();

    const listingData = {
      ...req.body,
      category,
      condition,
      imageUrl: req.file?.filename,
    };

    if (req.user) {
      listingData.user = req.user._id;
      if (!listingData.sellerName) {
        listingData.sellerName = `${req.user.name} (${req.user.faculty || "Student"})`;
      }
    }

    const newListing = await Listing.create(listingData);

    res.status(201).json({
      status: "success",
      message: "Listing created successfully",
      data: {
        listing: newListing,
      },
    });
  } catch (error) {
    // if the listing failed to save, don't leave an orphan image on disk
    if (req.file) {
      deleteUploadedFile("listings", req.file.filename);
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// PATCH /api/v1/listings/:id
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      if (req.file) deleteUploadedFile("listings", req.file.filename);

      return res.status(404).json({
        status: "fail",
        message: "Listing not found",
      });
    }

    // If user is authenticated and listing has an owner, check authorization
    if (listing.user && req.user) {
      if (
        String(listing.user) !== String(req.user._id) &&
        req.user.role !== "admin"
      ) {
        if (req.file) deleteUploadedFile("listings", req.file.filename);
        return res.status(403).json({
          status: "fail",
          message: "You can only edit your own listings unless you are an administrator.",
        });
      }
    }

    if (req.body.category) req.body.category = req.body.category.toLowerCase();
    if (req.body.condition) req.body.condition = req.body.condition.toLowerCase();

    if (req.file) {
      // a new image was uploaded — replace the old one
      if (listing.imageUrl) deleteUploadedFile("listings", listing.imageUrl);
      req.body.imageUrl = req.file.filename;
    }

    Object.assign(listing, req.body);

    const updatedListing = await listing.save();

    res.status(200).json({
      status: "success",
      message: "Listing updated successfully",
      data: {
        listing: updatedListing,
      },
    });
  } catch (error) {
    if (req.file) {
      deleteUploadedFile("listings", req.file.filename);
    }

    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// DELETE /api/v1/listings/:id
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        status: "fail",
        message: "Listing not found",
      });
    }

    // If user is authenticated and listing has an owner, check authorization
    if (listing.user && req.user) {
      if (
        String(listing.user) !== String(req.user._id) &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          status: "fail",
          message: "You can only delete your own listings unless you are an administrator.",
        });
      }
    }

    if (listing.imageUrl) {
      deleteUploadedFile("listings", listing.imageUrl);
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Listing deleted successfully",
      data: {
        listing,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/listings/:id/buy
exports.buyListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ status: "fail", message: "Listing not found" });
    }
    if (listing.status !== "available") {
      return res.status(400).json({ status: "fail", message: "This listing is no longer available." });
    }
    if (!listing.user) {
      const demoSeller = await User.findOne({ email: "seller@unitrade.test" });
      if (demoSeller) {
        listing.user = demoSeller._id;
        await listing.save();
      }
    }
    if (!listing.user) {
      return res.status(400).json({ status: "fail", message: "This listing has no student seller account." });
    }
    if (String(listing.user) === String(req.user._id)) {
      return res.status(400).json({ status: "fail", message: "You cannot buy your own listing." });
    }

    const seller = await User.findById(listing.user);
    if (!seller) {
      return res.status(400).json({ status: "fail", message: "The seller account could not be found." });
    }

    listing.status = "sold";
    await listing.save();

    if (typeof User.updateBalance === "function") {
      await User.updateBalance(seller._id, Number(listing.price));
    } else {
      seller.balance = Number(seller.balance || 0) + Number(listing.price);
      await seller.save();
    }

    const purchase = {
      listingId: String(listing._id),
      title: listing.title,
      price: Number(listing.price),
      sellerName: listing.sellerName,
      purchasedAt: new Date(),
    };
    if (typeof User.addPurchase === "function") {
      await User.addPurchase(req.user._id, purchase);
    } else {
      const buyer = await User.findById(req.user._id);
      buyer.purchaseHistory = buyer.purchaseHistory || [];
      buyer.purchaseHistory.unshift(purchase);
      await buyer.save();
    }

    const updatedBuyer = await User.findById(req.user._id);
    res.status(200).json({
      status: "success",
      message: `Purchase complete. ${listing.price.toLocaleString("en-US")} EGP was added to the seller's balance.`,
      data: { listing, user: { balance: updatedBuyer?.balance || 0 } },
    });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
