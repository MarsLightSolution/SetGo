// controllers/product.controller.js
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const Product       = require("../models/product.model");
const asyncHandler  = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const User = require('../models/user');

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
    showFullAddress,
    subscribe,
  } = req.body;

  if (!termsAccepted)
    throw new ApiError(400, "You must accept the terms and conditions.");

  if (!req.user?._id)
    throw new ApiError(401, "User authentication required.");

  if (!req.files?.pictures?.length)
    throw new ApiError(400, "At least one picture is required.");

  if (req.files.pictures.length > 20)
    throw new ApiError(400, "You can upload a maximum of 20 pictures.");

  const pictures = req.files.pictures.map(f => f.path.replace(/\\/g, "/"));

  const product = await Product.create({
    title,
    category,
    price: Number(price),
    description,
    pictures,
    location: {
      postalCode,
      street: streetNo || "",
    },
    name,
    termsAccepted: termsAccepted === true || termsAccepted === "true",
    owner: req.user._id,
    offerType,
    showFullAddress: showFullAddress === true || showFullAddress === "true",
    subscribe: subscribe === true || subscribe === "true",
  });

  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      sell: {
        productId: product._id,
        price: product.price,
        quantity: 1, // default, adjust if needed
        isSold: false,
      },
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, product, "Product added successfully."));
});

const getProducts = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;

  const pipeline = [];

  if (category?.trim()) {
    pipeline.push({
      $match: {
        category: new RegExp(`^${category.trim()}$`, "i"), // case-insensitive
      },
    });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  const options = {
    page: Number(page),
    limit: Number(limit),
    customLabels: {
      docs:        "products",
      totalDocs:   "totalProducts",
      page:        "currentPage",
      totalPages:  "totalPages",
      hasNextPage: "hasNextPage",
      hasPrevPage: "hasPrevPage",
      nextPage:    "nextPage",
      prevPage:    "prevPage",
    },
  };

  const result = await Product.aggregatePaginate(Product.aggregate(pipeline), options);
  


  res.status(200).json(new ApiResponse(200, result, "Filtered products with pagination."));
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json(new ApiResponse(200, product, "Fetched product by ID"));
});

module.exports = { addProduct, getProducts,getProductById };
