import multer from "multer";
import path from "path";

// Store all files in ./uploads with unique names
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

export const uploadPictures = multer({
  storage,
  limits: { files: 20 },           // hard-cap at 20 for safety
  fileFilter: (req, file, cb) => {
  const allowed = [
    "image/jpeg",  // covers both .jpg and .jpeg
    "image/jpg",   // redundant, but added per your request
    "image/png",
    "image/webp",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, .png, and .webp images are allowed"), false);
  }
},
});