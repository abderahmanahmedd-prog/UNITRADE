const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { LocalUserStore } = require("../utils/localStore");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your university email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, "Please provide your student ID number"],
      trim: true,
    },
    faculty: {
      type: String,
      default: "General Studies",
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    balance: {
      type: Number,
      min: 0,
      default: 0,
    },
    purchaseHistory: [
      {
        listingId: String,
        title: String,
        price: Number,
        sellerName: String,
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Instance method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const MongooseUser = mongoose.model("User", userSchema);

const UserHandler = {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (prop in LocalUserStore) {
      return LocalUserStore[prop];
    }
    return target[prop];
  },
};

const User = new Proxy(MongooseUser, UserHandler);

module.exports = User;
