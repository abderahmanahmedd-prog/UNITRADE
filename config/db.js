const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { initialSeed } = require("../utils/localStore");

let mongodInstance = null;

const seedDatabaseIfEmpty = async () => {
  try {
    const Listing = mongoose.model("Listing");
    const count = await Listing.countDocuments();
    if (count === 0) {
      console.log("🌱 Populating MongoDB with initial campus listings...");
      // Map seed data without string _id so Mongoose generates ObjectIds
      const seedToInsert = initialSeed.map(({ _id, ...rest }) => rest);
      await Listing.insertMany(seedToInsert);
      console.log("✅ MongoDB successfully seeded with", seedToInsert.length, "listings");
    }
  } catch (err) {
    console.warn("MongoDB seed note:", err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unitrade";

  // 1. If an existing MongoDB instance is already running, connect to it
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log("✅ MongoDB connected successfully to", uri);
    await seedDatabaseIfEmpty();
    return;
  } catch (err) {
    console.log("ℹ️ No existing MongoDB service detected on port 27017. Launching local MongoDB server...");
  }

  // 2. Launch persistent local MongoDB engine
  const dbPath = path.join(__dirname, "..", "data", "mongodb");
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  try {
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: "unitrade",
        dbPath: dbPath,
      },
    });
    console.log("🚀 Local MongoDB server running on standard port 27017");
  } catch (portErr) {
    // If 27017 is busy, allocate next available port
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbName: "unitrade",
        dbPath: dbPath,
      },
    });
    console.log("🚀 Local MongoDB server running on dynamic port");
  }

  const localUri = mongodInstance.getUri() + "unitrade";
  await mongoose.connect(localUri);
  console.log("✅ MongoDB connected successfully at:", localUri);

  await seedDatabaseIfEmpty();
};

// Graceful cleanup on process exit
process.on("SIGINT", async () => {
  if (mongodInstance) await mongodInstance.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (mongodInstance) await mongodInstance.stop();
  process.exit(0);
});

module.exports = connectDB;
