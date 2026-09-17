const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "listings.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed listings if file does not exist
const initialSeed = [
  {
    _id: "66e85a001111222233334441",
    title: "Calculus: Early Transcendentals (8th Edition)",
    description: "Required textbook for MATH 101/102. Good condition, no missing pages, minimal pencil annotations on chapters 2 and 4.",
    price: 350,
    category: "books",
    condition: "like-new",
    sellerName: "Sarah Jenkins (Senior, Engineering)",
    imageUrl: "seed-calculus.jpg",
    status: "available",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    _id: "66e85a001111222233334442",
    title: "Sony WH-1000XM4 Wireless Noise-Cancelling Headphones",
    description: "Black colour. Perfect for quiet study sessions in the campus library. Comes with original case, 3.5mm cable, and USB-C charger.",
    price: 2800,
    category: "electronics",
    condition: "used",
    sellerName: "Omar Tarek (Junior, Computer Science)",
    imageUrl: "seed-headphones.jpg",
    status: "available",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    _id: "66e85a001111222233334443",
    title: "Compact Wooden Dorm Study Desk",
    description: "Light oak finish, sturdy metal legs. Dimensions 100x50cm. Easy to assemble and fits nicely in any campus residence hall.",
    price: 850,
    category: "furniture",
    condition: "like-new",
    sellerName: "Maya Lin (Sophomore, Architecture)",
    imageUrl: "seed-desk.jpg",
    status: "available",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: "66e85a001111222233334444",
    title: "University Official Varsity Fleece Hoodie (Size M)",
    description: "Deep navy hoodie with embroidered university crest. Very warm and comfortable, worn only twice.",
    price: 450,
    category: "clothing",
    condition: "like-new",
    sellerName: "Alex Rivera (Freshman, Business)",
    imageUrl: "seed-hoodie.jpg",
    status: "available",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: "66e85a001111222233334445",
    title: "Chemistry Lab Coat & Safety Goggles Set",
    description: "Unisex size Medium 100% cotton lab coat + anti-fog splash goggles. Complies with university lab safety rules.",
    price: 250,
    category: "other",
    condition: "used",
    sellerName: "Hassan Aly (Pre-Med Student)",
    imageUrl: "seed-labcoat.jpg",
    status: "available",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

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

module.exports = {
  LocalListingStore,
  LocalDocument,
  initialSeed,
};
