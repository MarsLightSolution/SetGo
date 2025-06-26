const express = require("express");
const dotenv = require("dotenv").config();
const mongoose = require("./config/mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");

const app = express();

app.use('/api/assets', express.static(path.join(__dirname,'assets')));
const corsOptions = {
  origin: "http://localhost:5173", // Allow all origins (You can specify your frontend domain here)
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
}

// ✅ Enable CORS for frontend at http://localhost:5173
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true, // needed to allow cookies (like refresh token)
}));

app.use('/api/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/", require("./Routes"));

const port = process.env.PORT || 8080;
app.listen(port, (err) => {
  if (err) {
    console.log("Error:", err);
  } else {
    console.log("Server is running on Port", port);
  }
});
