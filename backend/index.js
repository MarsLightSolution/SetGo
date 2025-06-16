const express = require("express");
const dotenv = require("dotenv").config(); // Load environment variables
const mongoose = require("./config/mongoose"); // Import the Mongoose setup
const cors = require('cors');
const cookieParser = require("cookie-parser");
const path = require('path');
const app = express();
app.use('/api/assets', express.static(path.join(__dirname,'assets')));
const corsOptions = {
  origin: "http://localhost:5173", // Allow all origins (You can specify your frontend domain here)
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
}

app.use(cors(corsOptions))
app.use(express.json()); 
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));

// app.use("/asset", express.static("asset"));
app.use("/", require("./Routes"));
const port = process.env.PORT || 8080; // Default to port 3000 if PORT is not set
app.listen(port, (err) => {
  if (err) {
    console.log("Error:", err);
  } else {
    console.log("Server is running on Port", port);
  }
});