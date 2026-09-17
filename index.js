const path = require("path");
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const listingRoutes = require("./routes/listingRoutes");

const app = express();

// Middleware
app.use(express.json());

// Serve uploaded images statically
app.use("/api/v1/uploads", express.static(path.join(__dirname, "uploads")));

// Serve web frontend
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/v1/listings", listingRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`UniTrade server running on port ${PORT}`);
  });
});
