const mongoose = require("mongoose");
require("dotenv").config();
const logger = require('../utils/logger');

mongoose.connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info('Database connection established');
  })
  .catch((error) => {
    logger.error('Failed to connect to database', { message: error.message, stack: error.stack });
    process.exit(1);
  });

// Export the Mongoose connection object
module.exports = mongoose.connection;
