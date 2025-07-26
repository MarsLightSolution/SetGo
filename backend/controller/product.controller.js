// controllers/product.controller.js
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const Product = require("../models/product.model");
const User = require("../models/user");
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

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
    quantity,
    latitude,
    longitude,
  } = req.body;

  logger.info(`[AddProduct] Request body received`, { body: req.body });

  if (!termsAccepted) {
    logger.warn(`[AddProduct] Terms not accepted`);
    throw new ApiError(400, "You must accept the terms and conditions.");
  }

  if (!req.user?._id) throw new ApiError(401, "User authentication required.");

  const picturesRaw = Array.isArray(req.files?.pictures)
    ? req.files.pictures
    : req.files?.pictures
      ? [req.files.pictures]
      : [];

  if (!picturesRaw.length)
    throw new ApiError(400, "At least one picture is required.");

  if (picturesRaw.length > 20)
    throw new ApiError(400, "You can upload a maximum of 20 pictures.");

  if (!latitude || !longitude) {
    logger.warn(`[AddProduct] Missing latitude or longitude`);
    throw new ApiError(400, "Location coordinates are required.");
  }

  const validatePostalCodeWithGoogle = async (postalCode) => {
    try {
      const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          address: postalCode,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });

      const results = response.data.results;
      return results.length > 0;
    } catch (error) {
      logger.error("[PostalCodeValidation] Failed to validate postal code", { error: error.message });
      return false;
    }
  };

  const isPostalValid = await validatePostalCodeWithGoogle(postalCode);
  if (!isPostalValid) {
    logger.warn(`[AddProduct] Invalid or unknown postal code: ${postalCode}`);
    throw new ApiError(400, "Invalid or unknown postal code.");
  }

  // const pictures = req.files.pictures.map(f => f.path.replace(/\\/g, "/"));
  let pictures = [];
  logger.info(`[AddProduct] Pictures processed`, { count: pictures.length });

  const translateText = async (text) => {
    try {
      const response = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        {
          q: text,
          target: "de",
          format: "text",
          source: "en"
        },
        {
          params: {
            key: process.env.GOOGLE_MAPS_API_KEY, // Set this in your .env file
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const translated = response.data.data.translations[0].translatedText;
      return translated;
    } catch (error) {
      logger.warn(
        `[Translation] Failed to translate "${text}". Using fallback (en).`,
        { error: error.message }
      );
      return text; // fallback to English text if translation fails
    }
  };

  const translatedTitle = await translateText(title);
  const translatedCategory = await translateText(category);
  const translatedDescription = await translateText(description);
  const translatedName = await translateText(name);

  const product = await Product.create({
    title: { en: title, de: translatedTitle },
    category: { en: category, de: translatedCategory },
    price: Number(price),
    description: { en: description, de: translatedDescription },
    pictures,
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    },
    postalCode: postalCode || "",
    street: streetNo || "",
    name: { en: name, de: translatedName },
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
      isSold: false,
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
  const {
    category,
    page = 1,
    limit = 10,
    userId,
    minPrice = 0,
    maxPrice = 1000000,
    lang = "en",
  } = req.query;

  const validLangs = ["en", "de"];
  const selectedLang = validLangs.includes(lang) ? lang : "en";

  logger.info(`[GetProducts] Query`, {
    category,
    page,
    limit,
    userId,
    minPrice,
    maxPrice,
    lang: selectedLang,
  });

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

  const result = await Product.aggregatePaginate(
    Product.aggregate(pipeline),
    options
  );

  // Language-aware response mapping
  result.products = result.products.map((prod) => ({
    _id: prod._id,
    title: prod.title?.[selectedLang] || prod.title?.en || "",
    category: prod.category?.[selectedLang] || prod.category?.en || "",
    price: prod.price,
    description: prod.description?.[selectedLang] || prod.description?.en || "",
    pictures: prod.pictures,
    location: prod.location,
    name: prod.name?.[selectedLang] || prod.name?.en || "",
    termsAccepted: prod.termsAccepted,
    owner: prod.owner,
    isBuy: prod.isBuy,
    isSell: prod.isSell,
    createdAt: prod.createdAt,
    updatedAt: prod.updatedAt,
  }));

  logger.info(`[GetProducts] Retrieved products`, {
    total: result.totalProducts,
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Filtered products with pagination."));
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
    logger.info(`[MarkProductAsSold] Product already marked as sold`, {
      productId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product already marked as sold."));
  }

  product.isSell = true;
  await product.save();

  logger.info(`[MarkProductAsSold] Product updated as sold`, { productId });

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product marked as sold."));
});
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  if (!category) {
    throw new ApiError(400, "Category is required");
  }

  logger.info(`[getProductsByCategory] Fetching for category: ${category}`);

  const products = await Product.find({
    category: new RegExp(`^${category.trim()}$`, "i"),
    isSell: false,
  }).sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, products, "Fetched products by category"));
});
const getProductsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const userProducts = await Product.find({ owner: userId }).sort({
    createdAt: -1,
  });

  res
    .status(200)
    .json(
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

  // Delete associated images from filesystem
  if (product.pictures && product.pictures.length > 0) {
    product.pictures.forEach((imgPath) => {
      const fullPath = path.join(__dirname, "..", imgPath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error("Failed to delete image:", fullPath, err);
      });
    });
  }

  await Product.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully."));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const {
    title,
    category,
    price,
    description,
    postalCode,
    streetNo,
    name,
    offerType,
    showFullAddress,
    subscribe,
    isBuy,
    isSell,
    quantity,
    termsAccepted,
  } = req.body;

  // Parse and validate boolean fields
  const showFullAddressBool =
    showFullAddress === "true" || showFullAddress === true;
  const subscribeBool = subscribe === "true" || subscribe === true;
  const isBuyBool = isBuy === "true" || isBuy === true;
  const isSellBool = isSell === "true" || isSell === true;
  const termsAcceptedBool = termsAccepted === "true" || termsAccepted === true;

  if (!termsAcceptedBool) {
    throw new ApiError(400, "You must accept the terms and conditions.");
  }

  // Process new pictures if uploaded
  const picturesRaw = Array.isArray(req.files?.pictures)
    ? req.files.pictures
    : req.files?.pictures
      ? [req.files.pictures]
      : [];

  let pictures = product.pictures; // default to existing

  if (picturesRaw.length > 0) {
    if (picturesRaw.length > 20) {
      throw new ApiError(400, "You can upload a maximum of 20 pictures.");
    }

    // Delete previous images from filesystem
    product.pictures.forEach((imgPath) => {
      const fullPath = path.join(__dirname, "..", imgPath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error("Error deleting old image:", fullPath, err);
      });
    });

    // Replace with new uploaded paths
    pictures = picturesRaw.map((file) => file.path.replace(/\\/g, "/"));
  }

  // Update product fields
  product.title = title || product.title;
  product.category = category || product.category;
  product.price = Number(price) || product.price;
  product.description = description || product.description;
  product.pictures = pictures;
  product.name = name || product.name;
  product.termsAccepted = termsAcceptedBool;
  product.offerType = offerType || product.offerType;
  product.showFullAddress = showFullAddressBool;
  product.subscribe = subscribeBool;
  product.isBuy = isBuyBool;
  product.isSell = isSellBool;
  product.location = {
    postalCode: postalCode || product.location?.postalCode || "",
    street: streetNo || product.location?.street || "",
  };

  await product.save();

  // Optionally update user records (buy/sell history)
  const userId = req.user?._id;
  const pushObject = {};

  if (isBuyBool) {
    pushObject.buy = {
      productId: product._id,
      purchasedAt: new Date(),
      quantity: Number(quantity || 1),
      price: Number(price),
    };
  }

  if (isSellBool) {
    pushObject.sell = {
      productId: product._id,
      listedAt: new Date(),
      quantity: Number(quantity || 1),
      price: Number(price),
      isSold: false,
    };
  }

  if (userId && Object.keys(pushObject).length > 0) {
    await User.findByIdAndUpdate(userId, { $push: pushObject }, { new: true });
  }

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully."));
});

const getNearbyProducts = asyncHandler(async (req, res) => {
  const {
    latitude,
    longitude,
    radiusInKm = 10,
    page = 1,
    limit = 10,
  } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError(400, "Latitude and Longitude are required.");
  }

  const radiusInMeters = radiusInKm * 1000;

  const aggregate = Product.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: "distance",
        spherical: true,
        maxDistance: radiusInMeters,
        distanceMultiplier: 0.001, // Convert distance from meters to km
      },
    },
    { $sort: { distance: 1 } },
  ]);

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

  const result = await Product.aggregatePaginate(aggregate, options);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Nearby products fetched successfully."));
});

// module.exports = { addProduct, getProducts, getProductById, markProductAsSold, getNearbyProducts };
module.exports = {
  addProduct,
  getProducts,
  getProductById,
  getProductsByUser,
  deleteProduct,
  updateProduct,
  markProductAsSold,
  getProductsByCategory,
  getNearbyProducts,
};
