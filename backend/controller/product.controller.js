// controllers/product.controller.js
const asyncHandler  = require("../utils/asyncHandler");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const Product       = require("../models/product.model");
const User          = require("../models/User");
const mongoose      = require("mongoose");
const logger        = require("../utils/logger");

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
    isBuy,
    isSell,
    quantity
  } = req.body;

  if (!termsAccepted)
    throw new ApiError(400, "You must accept the terms and conditions.");

  if (!req.user?._id)
    throw new ApiError(401, "User authentication required.");

  const picturesRaw = Array.isArray(req.files?.pictures)
    ? req.files.pictures
    : req.files?.pictures ? [req.files.pictures] : [];

  if (!picturesRaw.length)
    throw new ApiError(400, "At least one picture is required.");

  if (picturesRaw.length > 20)
    throw new ApiError(400, "You can upload a maximum of 20 pictures.");

  const pictures = picturesRaw.map(f => f.path.replace(/\\/g, "/"));

  const product = await Product.create({
    title,
    category,
    price: Number(price),
    description,
    pictures,
    location: {
      postalCode: postalCode || "",
      street: streetNo || "",
    },
    name,
    termsAccepted: termsAccepted === "true" || termsAccepted === true,
    offerType,
    showFullAddress: showFullAddress === "true" || showFullAddress === true,
    subscribe: subscribe === "true" || subscribe === true,
    isBuy: isBuy === "true" || isBuy === true,
    isSell: isSell === "true" || isSell === true,
    owner: req.user?._id || null,
  });

  const userId = req.user._id;
  const pushObject = {};

  if (product.isBuy) {
    pushObject.buy = {
      productId: product._id,
      purchasedAt: new Date(),
      quantity: Number(quantity || 1),
      price: Number(price),
    };
  }

  if (product.isSell) {
    pushObject.sell = {
      productId: product._id,
      listedAt: new Date(),
      quantity: Number(quantity || 1),
      price: Number(price),
      isSold: false
    };
  }

  if (Object.keys(pushObject).length) {
    await User.findByIdAndUpdate(userId, { $push: pushObject }, { new: true });
  }

  res
    .status(201)
    .json(new ApiResponse(201, product, "Product added successfully."));
});

const getProducts = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10, userId, minPrice = 0, maxPrice = 1000000 } = req.query;

  logger.info(`[GetProducts] Query`, { category, page, limit, userId, minPrice, maxPrice });

  const pipeline = [];

  // Category filter
  if (category?.trim() && category !== "All Products") {
    pipeline.push({
      $match: {
        category: new RegExp(`^${category.trim()}$`, "i"),
      },
    });
  }

  // Main filter
  const matchStage = {
    isSell: false,
    price: {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    },
  };

  // Exclude current user
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchStage.owner = { $ne: new mongoose.Types.ObjectId(userId) };
  }

  pipeline.push({ $match: matchStage });
  pipeline.push({ $sort: { createdAt: -1 } });

  const options = {
    page: Number(page),
    limit: Number(limit),
    customLabels: {
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

const markProductAsSold = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    logger.warn(`[MarkProductAsSold] Invalid product ID`, { productId });
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId);

  if (!product) {
    logger.warn(`[MarkProductAsSold] Product not found`, { productId });
    throw new ApiError(404, "Product not found");
  }

  if (product.isSell === true) {
    logger.info(`[MarkProductAsSold] Product already marked as sold`, { productId });
    return res.status(200).json(new ApiResponse(200, product, "Product already marked as sold."));
  }

  product.isSell = true;
  await product.save();

  logger.info(`[MarkProductAsSold] Product updated as sold`, { productId });

  res.status(200).json(new ApiResponse(200, product, "Product marked as sold."));
});
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  if (!category) {
    throw new ApiError(400, "Category is required");
  }

  logger.info(`[getProductsByCategory] Fetching for category: ${category}`);

  const products = await Product.find({
    category: new RegExp(`^${category.trim()}$`, "i"),
    isSell: false
  }).sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, products, "Fetched products by category"));
});
const getProductsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const userProducts = await Product.find({ owner: userId }).sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, userProducts, "Fetched user's ads successfully.")
  );
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await Product.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully."));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!updatedProduct) {
    throw new ApiError(404, "Product not found or not updated");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully."));
});

module.exports = { addProduct, getProducts,getProductById, getProductsByUser, deleteProduct, updateProduct, markProductAsSold, getProductsByCategory  };
