// controllers/product.controller.js
const ApiError    = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const Product     = require("../models/product.model.js");
const asyncHandler = require("../utils/asyncHandler.js"); // if you have one
// const { uploadOnCloudinary } = require("../utils/cloudinary.js");


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

  console.log(req.body);

  /* 1️⃣ basic field validation */
  if (!termsAccepted) {
    throw new ApiError(400, "You must accept the terms and conditions.");
  }

  /* 2️⃣ picture validation */
  console.log("req.files:", req.files);          // should be { pictures: [ ... ] }

  if (!req.files?.pictures || req.files.pictures.length === 0) {
    throw new ApiError(400, "At least one picture is required.");
  }
  if (req.files.pictures.length > 20) {
    throw new ApiError(400, "You can upload a maximum of 20 pictures.");
  }

  /* 3️⃣ store the image paths (or Cloudinary URLs) */
  // const pictures = [];
  const pictures = req.files.pictures.map(file => file.path)

  /* 4️⃣ create the product */
  const product = await Product.create({
    title,
    category,
    price: Number(price),
    description,
    pictures,
    location: { postalCode: postalCode || "1", streetNo: streetNo || "" },
    name,
    termsAccepted: termsAccepted === "true" || termsAccepted === true,
    offerType,
    showFullAddress: showFullAddress === "true" || showFullAddress === true,
    subscribe: subscribe === "true" || subscribe === true,
    isBuy: isBuy === "true" || isBuy === true,
    isSell: isSell === "true" || isSell === true,
    owner: req.user?._id || null,
  });

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
  }

  res
    .status(201)
    .json(new ApiResponse(201, product, "Product added successfully."));
});


const getPaginatedProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;

  const pipeline = [];
  if (category?.trim()) pipeline.push({ $match: { category: category.trim() } });
  pipeline.push({ $sort: { createdAt: -1 } });

  const options = {
    page:  Number(page),
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

  res.status(200).json(new ApiResponse(200, result, "Paginated product list."));
});

module.exports = { addProduct, getPaginatedProducts };
