const mongoose = require("mongoose");
const Product = require("./models/product.model"); // make sure path is correct

const logger = require('./utils/logger');
// MongoDB connection URI must come from environment variables
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  logger.error('MONGO_URI environment variable not set. Aborting migration.');
  process.exit(1);
}

async function migrate() {
  try {
    // Connect to Atlas
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB Atlas');

    // Fetch all products
    const products = await Product.find();
    logger.info('Found products for migration', { count: products.length });

    // Add review-related fields to existing products if missing
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
        logger.info('Updated product during migration', { productId: product._id });
      }
    }

    logger.info('Migration complete! All products have review fields now.');

    // Disconnect from DB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB Atlas');
  } catch (err) {
    logger.error('Migration failed', { message: err.message, stack: err.stack });
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB Atlas (after error)');
  }
}

migrate();
