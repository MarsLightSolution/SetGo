const multer = require("multer");
const path = require("path");

// ---------- Product Uploads (./uploads) ----------
const productStorage = multer.diskStorage({
  destination: "./uploads",
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
  destination: "./uploads/chat",
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadChatFiles = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file (adjust as needed)
});

module.exports = {
  uploadPictures,   // for product routes
  uploadChatFiles,  // for chat routes
};
