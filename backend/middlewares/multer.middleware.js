const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ---------- Product Uploads (./uploads) ----------
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir("./uploads");
    cb(null, "./uploads");
  },
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadPictures = multer({
  storage: productStorage,
  limits: { files: 20 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, and .webp images are allowed"), false);
    }
  },
});

// ---------- Chat Uploads (./uploads/chat) ----------
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir("./uploads/chat");
    cb(null, "./uploads/chat");
  },
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadChatFiles = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// ---------- Shop Uploads (./uploads/shop) - NEW ----------
const shopStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir("./uploads/shop");
    cb(null, "./uploads/shop");
  },
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const shopUpload = multer({
  storage: shopStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, and .webp images are allowed"), false);
    }
  },
});

// Shop images: logo and banner
const uploadShopImages = shopUpload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);
// ---------- Concern Uploads (./uploads/concerns) - NEW ----------
const concernStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir("./uploads/concerns");
    cb(null, "./uploads/concerns");
  },
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadConcernImages = multer({
  storage: concernStorage,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, and .webp images are allowed"), false);
    }
  },
});

module.exports = {
  uploadPictures,     // for product routes
  uploadChatFiles,    // for chat routes
  uploadShopImages, 
  uploadConcernImages,  // for shop routes (NEW)
};
