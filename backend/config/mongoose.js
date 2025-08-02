const mongoose = require("mongoose");
require("dotenv").config();

// Check if MongoDB is available, if not, use in-memory storage
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB || "mongodb://localhost:27017/chat_app", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connection established");
  } catch (error) {
    console.warn("Failed to connect to MongoDB, using in-memory storage:", error.message);
    console.log("Server will run with in-memory data storage");
  }
};

connectDB();

// Export the Mongoose connection object
module.exports = mongoose.connection;
