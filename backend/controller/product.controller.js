// controllers/product.controller.js
const ApiError      = require("../utils/ApiError.js");
const ApiResponse   = require("../utils/ApiResponse.js");
const Product       = require("../models/product.model.js");
const mongoose      = require("mongoose");

// CREATE Product (Offer)
const addProduct = async (req, res, next) => {
  try {
    const {
      title,
      category,
      price,
      description,
      postalCode,
      streetNo,
      name,
      termsAccepted,
      offerType,
      location,
      showFullAddress,
      subscribe,
    } = req.body;

    //  Check required field
    if (!termsAccepted) {
      throw new ApiError(400, "You must accept the terms and conditions.");
    }

    // Upload pictures (locally stored files)
    const pictures = [];

    /* 
    // Uncomment if you want to enforce pictures later
    if (!req.files || !req.files.pictures || req.files.pictures.length === 0) {
      throw new ApiError(400, "At least one picture is required.");
    }
    if (req.files.pictures.length > 20) {
      throw new ApiError(400, "You can upload a maximum of 20 pictures.");
    }
    for (const file of req.files.pictures) {
      pictures.push(file.path);           // local storage
      // OR const { secure_url } = await uploadOnCloudinary(file.path);
      // pictures.push(secure_url);        // Cloudinary
    }
    */

    const product = await Product.create({
      title,
      category,
      price,
      description,
      pictures,
      location: {
        postalCode,
        streetNo: streetNo || "",
      },
      name,
      termsAccepted,
      owner: req.user?._id || null,
      offerType,
      location,
      showFullAddress,
      subscribe,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, product, "Product added successfully."));
  } catch (error) {
    // Pass control to your global error handler
    next(error);
  }
};

// GET Paginated Products
const getPaginatedProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    // Build aggregation pipeline
    const pipeline = [];

    if (category && typeof category === "string" && category.trim() !== "") {
      pipeline.push({ $match: { category: category.trim() } });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const aggregate = Product.aggregate(pipeline);

    const options = {
      page:  parseInt(page, 10),
      limit: parseInt(limit, 10),
      customLabels: {
        docs:         "products",
        totalDocs:    "totalProducts",
        page:         "currentPage",
        totalPages:   "totalPages",
        hasNextPage:  "hasNextPage",
        hasPrevPage:  "hasPrevPage",
        nextPage:     "nextPage",
        prevPage:     "prevPage",
      },
    };

    const result = await Product.aggregatePaginate(aggregate, options);

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Paginated product list."));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProduct,
  getPaginatedProducts,
};
