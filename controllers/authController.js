const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "unitrade-jwt-super-secret-key-2026";
const JWT_EXPIRES_IN = "30d";

const signToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, studentId, faculty, password, role } = req.body;

    if (!name || !email || !studentId || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide all required fields: name, email, studentId, and password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "An account with this university email already exists.",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      studentId: studentId.trim(),
      faculty: faculty ? faculty.trim() : "General Studies",
      password,
      role: role === "admin" ? "admin" : "student",
    });

    const token = signToken(user._id, user.role);

    res.status(201).json({
      status: "success",
      message: "Student account created successfully!",
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          faculty: user.faculty,
          role: user.role,
          balance: user.balance || 0,
          purchaseHistory: user.purchaseHistory || [],
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide both university email and password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Need password explicitly because it has select: false
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect university email or password.",
      });
    }

    const token = signToken(user._id, user.role);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully!",
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          faculty: user.faculty,
          role: user.role,
          balance: user.balance || 0,
          purchaseHistory: user.purchaseHistory || [],
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// GET /api/v1/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          faculty: user.faculty,
          role: user.role,
          balance: user.balance || 0,
          purchaseHistory: user.purchaseHistory || [],
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
