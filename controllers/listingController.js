const Listing = require("../models/Listing");
const deleteUploadedFile = require("../utils/delete-uploaded-file");

// GET /api/v1/listings
// Supports optional filtering: /api/v1/listings?category=books&status=available
exports.getAllListings = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) filter.category = req.query.category.toLowerCase();
    if (req.query.status) filter.status = req.query.status.toLowerCase();

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

    const newListing = await Listing.create({
      ...req.body,
      category,
      condition,
      imageUrl: req.file?.filename,
    });

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
    const deletedListing = await Listing.findByIdAndDelete(req.params.id);

    if (!deletedListing) {
      return res.status(404).json({
        status: "fail",
        message: "Listing not found",
      });
    }

    if (deletedListing.imageUrl) {
      deleteUploadedFile("listings", deletedListing.imageUrl);
    }

    res.status(200).json({
      status: "success",
      message: "Listing deleted successfully",
      data: {
        listing: deletedListing,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
