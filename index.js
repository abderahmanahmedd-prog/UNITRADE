const path = require("path");
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const listingRoutes = require("./routes/listingRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Serve uploaded images statically
app.use("/api/v1/uploads", express.static(path.join(__dirname, "uploads")));

// Serve web frontend
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/v1/auth", authRoutes);
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
