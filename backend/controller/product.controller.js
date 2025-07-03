// controllers/product.controller.js

const ApiError      = require("../utils/ApiError");
const ApiResponse   = require("../utils/ApiResponse");
const Product       = require("../models/product.model");
const User          = require("../models/user");
const asyncHandler  = require("../utils/asyncHandler");
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
    owner: "",

    offerType,
    showFullAddress: showFullAddress === "true" || showFullAddress === true,
    subscribe: subscribe === "true" || subscribe === true,
    isBuy: isBuy === "true" || isBuy === true,
    isSell: isSell === "true" || isSell === true,
    owner: "",
  });

  logger.info(`[AddProduct] Product created`, { productId: product._id });

  // --- Commented user update ---
  /*
  const userId = req.user?._id;
  const userUpdatePayload = {};

  if (product.isBuy) {
    userUpdatePayload.$push = {
      buy: {
        productId: product._id,
        purchasedAt: new Date(),
        quantity: Number(quantity || 1),
        price: Number(price),
      }
    };
  }

  if (product.isSell) {
    userUpdatePayload.$push = {
      sell: {
        productId: product._id,
        listedAt: new Date(),
        quantity: Number(quantity || 1),
        price: Number(price),
        isSold: false
      }
    };
  }

  if (Object.keys(userUpdatePayload).length > 0) {
    await User.findByIdAndUpdate(userId, userUpdatePayload, { new: true });
    logger.info(`[AddProduct] User updated`, { userId: userId });
  }
  */

  res.status(201).json(new ApiResponse(201, product, "Product added successfully."));
});

const getProducts = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;

  logger.info(`[GetProducts] Query`, { category, page, limit });

  const pipeline = [];

  if (category?.trim()) {
    pipeline.push({
      $match: {
        category: new RegExp(`^${category.trim()}$`, "i"),
      },
      name,
      termsAccepted,
      owner: req.user?._id || null,
      offerType,
      location,
      showFullAddress,
      subscribe,
    });

    logger.info(`[GetProducts] Filter applied for category`, { category });
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

// GET Paginated Products
// const getPaginatedProducts = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 10, category } = req.query;

//     // Build aggregation pipeline
//     const pipeline = [];

//     if (category && typeof category === "string" && category.trim() !== "") {
//       pipeline.push({ $match: { category: category.trim() } });
//     }

//     pipeline.push({ $sort: { createdAt: -1 } });

//     const aggregate = Product.aggregate(pipeline);

//     const options = {
//       page:  parseInt(page, 10),
//       limit: parseInt(limit, 10),
//       customLabels: {
//         docs:         "products",
//         totalDocs:    "totalProducts",
//         page:         "currentPage",
//         totalPages:   "totalPages",
//         hasNextPage:  "hasNextPage",
//         hasPrevPage:  "hasPrevPage",
//         nextPage:     "nextPage",
//         prevPage:     "prevPage",
//       },
//     };
//   }
// });

const getPaginatedProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;

  const pipeline = [];

  if (category && typeof category === "string" && category.trim() !== "") {
    pipeline.push({ $match: { category: category.trim() } });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  const aggregate = Product.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
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

  const result = await Product.aggregatePaginate(aggregate, options);

  logger.info(`[GetPaginatedProducts] Retrieved products`, { total: result.totalProducts });

  res.status(200).json(new ApiResponse(200, result, "Paginated products fetched successfully."));
});

module.exports = { addProduct, getProducts, getProductById, getPaginatedProducts };

