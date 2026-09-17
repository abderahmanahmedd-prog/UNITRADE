const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "listings.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// The catalog starts empty; students add their own listings.
const initialSeed = [];

function readData() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(initialSeed, null, 2), "utf8");
    return [...initialSeed];
  }
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [...initialSeed];
  }
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf8");
}

class LocalDocument {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const all = readData();
    const index = all.findIndex((item) => String(item._id) === String(this._id));
    this.updatedAt = new Date().toISOString();
    if (index !== -1) {
      all[index] = { ...this };
    } else {
      all.push({ ...this });
    }
    writeData(all);
    return new LocalDocument(this);
  }
}

class LocalListingStore {
  static find(filter = {}) {
    const all = readData();
    let results = all.filter((item) => {
      if (filter.category && item.category !== filter.category) return false;
      if (filter.status && item.status !== filter.status) return false;
      if (filter.user && String(item.user) !== String(filter.user)) return false;
      return true;
    });

    return {
      sort(sortObj = { createdAt: -1 }) {
        const sorted = [...results].sort((a, b) => {
          if (sortObj.createdAt === -1) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        return Promise.resolve(sorted.map((item) => new LocalDocument(item)));
      },
      then(resolve, reject) {
        return Promise.resolve(results.map((item) => new LocalDocument(item))).then(resolve, reject);
      },
    };
  }

  static async findById(id) {
    const all = readData();
    const item = all.find((x) => String(x._id) === String(id));
    if (!item) return null;
    return new LocalDocument(item);
  }

  static async create(data) {
    const all = readData();
    const newItem = {
      _id: crypto.randomBytes(12).toString("hex"),
      title: data.title,
      description: data.description,
      price: Number(data.price),
      category: data.category || "other",
      condition: data.condition || "used",
      sellerName: data.sellerName,
      imageUrl: data.imageUrl || null,
      user: data.user || null,
      status: data.status || "available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    all.unshift(newItem);
    writeData(all);
    return new LocalDocument(newItem);
  }

  static async findByIdAndDelete(id) {
    const all = readData();
    const index = all.findIndex((x) => String(x._id) === String(id));
    if (index === -1) return null;
    const [deleted] = all.splice(index, 1);
    writeData(all);
    return new LocalDocument(deleted);
  }
}

class LocalUserStore {
  static getUsersFile() {
    return path.join(dataDir, "users.json");
  }

  static readUsers() {
    const uFile = this.getUsersFile();
    if (!fs.existsSync(uFile)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(uFile, "utf8"));
    } catch {
      return [];
    }
  }

  static writeUsers(users) {
    fs.writeFileSync(this.getUsersFile(), JSON.stringify(users, null, 2), "utf8");
  }

  static findOne(query = {}) {
    const users = this.readUsers();
    let found = users.find((u) => {
      for (const [k, v] of Object.entries(query)) {
        if (u[k] !== v) return false;
      }
      return true;
    });

    const chain = {
      select() {
        return chain;
      },
      then(resolve, reject) {
        if (!found) return Promise.resolve(null).then(resolve, reject);
        const doc = new LocalDocument(found);
        doc.comparePassword = async function (cand) {
          const bcrypt = require("bcryptjs");
          return await bcrypt.compare(cand, doc.password);
        };
        return Promise.resolve(doc).then(resolve, reject);
      },
    };
    return chain;
  }

  static async findById(id) {
    const users = this.readUsers();
    const found = users.find((u) => String(u._id) === String(id));
    if (!found) return null;
    const doc = new LocalDocument(found);
    doc.comparePassword = async function (cand) {
      const bcrypt = require("bcryptjs");
      return await bcrypt.compare(cand, doc.password);
    };
    return doc;
  }

  static async create(data) {
    const users = this.readUsers();
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = {
      _id: crypto.randomBytes(12).toString("hex"),
      name: data.name,
      email: data.email.toLowerCase(),
      studentId: data.studentId,
      faculty: data.faculty || "General Studies",
      password: hashedPassword,
      role: data.role || "student",
      balance: Number(data.balance) || 0,
      purchaseHistory: data.purchaseHistory || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.writeUsers(users);
    const doc = new LocalDocument(newUser);
    doc.comparePassword = async function (cand) {
      return await bcrypt.compare(cand, doc.password);
    };
    return doc;
  }

  static async updateBalance(id, amount) {
    const users = this.readUsers();
    const index = users.findIndex((user) => String(user._id) === String(id));
    if (index === -1) return null;

    users[index].balance = Math.max(0, Number(users[index].balance || 0) + Number(amount));
    users[index].updatedAt = new Date().toISOString();
    this.writeUsers(users);

    const doc = new LocalDocument(users[index]);
    doc.comparePassword = async function (cand) {
      return await bcrypt.compare(cand, doc.password);
    };
    return doc;
  }

  static async addPurchase(id, purchase) {
    const users = this.readUsers();
    const index = users.findIndex((user) => String(user._id) === String(id));
    if (index === -1) return null;

    users[index].purchaseHistory = users[index].purchaseHistory || [];
    users[index].purchaseHistory.unshift(purchase);
    users[index].updatedAt = new Date().toISOString();
    this.writeUsers(users);
    return new LocalDocument(users[index]);
  }
}

module.exports = {
  LocalListingStore,
  LocalUserStore,
  LocalDocument,
  initialSeed,
};

