// controllers/product.controller.js
const asyncHandler  = require("../utils/asyncHandler");
const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const Product       = require("../models/product.model");
const User          = require("../models/user");

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

  logger.info(`[AddProduct] Request body received`, { body: req.body });

  if (!termsAccepted) {
    logger.warn(`[AddProduct] Terms not accepted`);
    throw new ApiError(400, "You must accept the terms and conditions.");
  }

  if (!req.files?.pictures?.length) {
    logger.warn(`[AddProduct] No pictures uploaded`);
    throw new ApiError(400, "At least one picture is required.");
  }

  if (req.files.pictures.length > 20) {
    logger.warn(`[AddProduct] Too many pictures uploaded`);
    throw new ApiError(400, "You can upload a maximum of 20 pictures.");
  }

  const pictures = req.files.pictures.map(f => f.path.replace(/\\/g, "/"));
  logger.info(`[AddProduct] Pictures processed`, { count: pictures.length });

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
    termsAccepted: termsAccepted === true || termsAccepted === "true",
    owner: req.user?._id || "",
    offerType,
    showFullAddress: showFullAddress === "true" || showFullAddress === true,
    subscribe: subscribe === "true" || subscribe === true,
    isBuy: isBuy === "true" || isBuy === true,
    isSell: isSell === "true" || isSell === true,
  });

  logger.info(`[AddProduct] Product created`, { productId: product._id });

  res.status(201).json(new ApiResponse(201, product, "Product added successfully."));
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

  logger.info(`[GetProducts] Retrieved products`, { total: result.totalProducts });

  res.status(200).json(new ApiResponse(200, result, "Filtered products with pagination."));
});


const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    logger.warn(`[GetProductById] Invalid ID`, { id });
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);

  if (!product) {
    logger.warn(`[GetProductById] Product not found`, { id });
    throw new ApiError(404, "Product not found");
  }

  logger.info(`[GetProductById] Product found`, { id });

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

module.exports = { addProduct, getProducts, getProductById, markProductAsSold };
