const mongoose = require("mongoose");
const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unitrade";

  // 1. If an existing MongoDB instance is already running, connect to it
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log("✅ MongoDB connected successfully to", uri);
    return;
  } catch (err) {
    console.warn("MongoDB unavailable; using the local JSON data store.");
  }
};

module.exports = connectDB;
