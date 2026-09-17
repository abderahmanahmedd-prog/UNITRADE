const mongoose = require("mongoose");
const { LocalListingStore } = require("../utils/localStore");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A listing must have a title"],
      trim: true,
      maxlength: [80, "Title cannot exceed 80 characters"],
    },
    description: {
      type: String,
      required: [true, "A listing must have a description"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "A listing must have a price"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "A listing must belong to a category"],
      enum: ["books", "electronics", "furniture", "clothing", "other"],
    },
    condition: {
      type: String,
      required: [true, "A listing must specify an item condition"],
      enum: ["new", "like-new", "used", "fair"],
    },
    sellerName: {
      type: String,
      required: [true, "A listing must have a seller name"],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

const MongooseListing = mongoose.model("Listing", listingSchema);

const ListingHandler = {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in LocalListingStore) {
      return LocalListingStore[prop];
    }
    return target[prop];
  },
};

const Listing = new Proxy(MongooseListing, ListingHandler);

module.exports = Listing;

