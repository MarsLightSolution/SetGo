const mongoose = require("mongoose");
const Product = require("./models/product.model"); // make sure path is correct

// ✅ Your MongoDB Atlas URI
const MONGO_URI = "mongodb+srv://tiwariraj1202:RAJtiwari9165%40@cluster0.dwmup.mongodb.net/SetGo?retryWrites=true&w=majority&appName=Cluster0";

async function migrate() {
  try {
    // ✅ Connect to Atlas
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB Atlas");

    // ✅ Fetch all products
    const products = await Product.find();
    console.log(`📦 Found ${products.length} products.`);

    // ✅ Add review-related fields to existing products if missing
    for (const product of products) {
      let changed = false;

      if (!product.reviews) {
        product.reviews = [];
        changed = true;
      }

      if (product.averageRating === undefined) {
        product.averageRating = 0;
        changed = true;
      }

      if (changed) {
        await product.save();
        console.log(`✅ Updated product: ${product._id}`);
      }
    }

    console.log("🎉 Migration complete! All products have review fields now.");

    // ✅ Disconnect from DB
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB Atlas");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB Atlas (after error)");
  }
}

migrate();
