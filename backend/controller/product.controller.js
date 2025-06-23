const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const Product = require("../models/product.model.js");
// const { uploadOnCloudinary } = require("../utils/cloudinary.js"); // Remove if not using
const mongoose = require("mongoose");

// 🔹 CREATE Product (Offer)
const addProduct = asyncHandler(async (req, res) => {
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

  // ✅ Check required field
  if (!termsAccepted) {
    throw new ApiError(400, "You must accept the terms and conditions.");
  }

  // ✅ Upload pictures (locally stored files)
  const pictures = [];

  // if (!req.files || !req.files.pictures || req.files.pictures.length === 0) {
  //   throw new ApiError(400, "At least one picture is required.");
  // }

  // if (req.files.pictures.length > 20) {
  //   throw new ApiError(400, "You can upload a maximum of 20 pictures.");
  // }

  // for (const file of req.files.pictures) {
  //   // If using local storage, just push local file paths
  //   pictures.push(file.path);
  // }

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
console.log(product);
  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product added successfully."));
});

//  GET Paginated Products
const getPaginatedProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;

  // Initialize an empty array for the aggregation pipeline
  const pipeline = [];

  // Conditionally add the $match stage if a valid category is provided
  // It's important to check if 'category' is a non-empty string
  if (category && typeof category === "string" && category.trim() !== "") {
    pipeline.push({ $match: { category: category.trim() } });
  }

  // Always add the $sort stage
  pipeline.push({ $sort: { createdAt: -1 } });

  // Pass the constructed pipeline array to Product.aggregate()
  const aggregate = Product.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10), // Ensure base 10 for parseInt
    limit: parseInt(limit, 10), // Ensure base 10 for parseInt
    customLabels: {
      // It's good practice to define custom labels for clarity
      docs: "products",
      totalDocs: "totalProducts",
      page: "currentPage",
      totalPages: "totalPages",
      hasNextPage: "hasNextPage",
      hasPrevPage: "hasPrevPage",
      nextPage: "nextPage",
      prevPage: "prevPage",
    },
  };

  // aggregatePaginate expects the aggregate object and options
  const result = await Product.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Paginated product list"));
});

module.exports = {
  addProduct,
  getPaginatedProducts,
};
