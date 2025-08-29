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
    condition,
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
    inputLanguage,
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

  const pictures = picturesRaw.map(f => f.path.replace(/\\/g, "/"));
  logger.info(`[AddProduct] Pictures processed`, { count: pictures.length });

  const targetLanguages = ["en", "az", "ru"];
  const sourceLanguage = targetLanguages.includes(inputLanguage) ? inputLanguage : "en";


  const translateText = async (text, targetLang) => {
    if (targetLang === sourceLanguage) {
      return text;
    }
    try {
      const response = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        {
          q: text,
          target: targetLang,
          format: "text",
          source: sourceLanguage,
        },
        {
          params: {
            key: process.env.GOOGLE_MAPS_API_KEY,
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
        `[Translation] Failed to translate "${text}" from ${sourceLanguage} to ${targetLang}. Using fallback (original text).`,
        { error: error.message }
      );
      return text;
    }
  };

  const productTitle = {};
  const productCategory = {};
  const productDescription = {};
  const productName = {};

  for (const lang of targetLanguages) {
    productTitle[lang] = await translateText(title, lang);
    productCategory[lang] = await translateText(category, lang);
    productDescription[lang] = await translateText(description, lang);
    productName[lang] = await translateText(name, lang);
  }

  const product = await Product.create({
    title: productTitle,
    category: productCategory,
    price: Number(price),
    description: productDescription,
    condition:condition|| "",
    // description: { en: description, de: translatedDescription },
    pictures,
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    },
    postalCode: postalCode || "",
    street: streetNo || "",
    name: productName,
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
    condition,
    city,
    latitude,
    longitude,
    radiusInKm,
    search,
    postalCode, // ✅ Added postal code from query
  } = req.query;

  const validLangs = ["en", "az", "ru"];
  const selectedLang = validLangs.includes(lang) ? lang : "en";

  // ✅ Escape regex helper
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  logger.info("[GetProducts] Query Params", {
    category,
    page,
    limit,
    userId,
    minPrice,
    maxPrice,
    lang: selectedLang,
    condition,
    city,
    latitude,
    longitude,
    radiusInKm,
    search,
    postalCode, // log postal code
  });

  const pipeline = [];

  // ✅ Category filter
  if (category?.trim() && category !== "All Products") {
    pipeline.push({
      $match: {
        [`category.${selectedLang}`]: new RegExp(`^${escapeRegex(category.trim())}$`, "i"),
      },
    });
  }

  // ✅ Search filter on title & description
  if (search) {
    const safeSearch = escapeRegex(search);
    pipeline.push({
      $match: {
        $or: [
          { [`title.${selectedLang}`]: { $regex: safeSearch, $options: "i" } },
          { [`description.${selectedLang}`]: { $regex: safeSearch, $options: "i" } },
        ],
      },
    });
  }

  // ✅ General filter stage
  const matchStage = {
    isSell: false,
    price: {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    },
  };

  if (condition) matchStage.condition = condition;

  // ✅ Exclude user's own products
  if (userId) {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      matchStage.owner = { $ne: new mongoose.Types.ObjectId(userId) };
    } else {
      matchStage.owner = { $ne: userId.toString() };
    }
  }

  // ✅ Geolocation or city filtering
  if (latitude && longitude && radiusInKm) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMeters = parseFloat(radiusInKm) * 1000;

    matchStage["location.coordinates"] = {
      $geoWithin: {
        $centerSphere: [[lng, lat], radiusMeters / 6378137],
      },
    };
  } else if (city) {
    matchStage["location.city"] = new RegExp(`^${escapeRegex(city.trim())}$`, "i");
  }

  // ✅ Postal code filter
  if (postalCode?.trim()) {
    matchStage["postalCode"] = new RegExp(`^${escapeRegex(postalCode.trim())}$`, "i");
  }

  pipeline.push({ $match: matchStage });

  // ✅ Sort by latest creation date
  pipeline.push({ $sort: { createdAt: -1 } });

  // ✅ Projection
  pipeline.push({
    $project: {
      _id: 1,
      title: { $ifNull: [`$title.${selectedLang}`, "$title.en"] },
      category: { $ifNull: [`$category.${selectedLang}`, "$category.en"] },
      description: { $ifNull: [`$description.${selectedLang}`, "$description.en"] },
      name: { $ifNull: [`$name.${selectedLang}`, "$name.en"] },
      price: 1,
      condition: 1,
      pictures: 1,
      location: 1,
      termsAccepted: 1,
      owner: 1,
      isBuy: 1,
      isSell: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  });

  // Pagination options
  const options = {
    page: Number(page) > 0 ? Number(page) : 1,
    limit: Number(limit) > 0 ? Number(limit) : 10,
    customLabels: {
      docs: "products",
      totalDocs: "totalProducts",
      page: "currentPage",
      totalPages: "totalPages",
      hasPrevPage: "hasPrevPage",
      hasNextPage: "hasNextPage",
      prevPage: "prevPage",
      nextPage: "nextPage",
    },
  };

  // Execute aggregation pipeline with pagination
  const result = await Product.aggregatePaginate(Product.aggregate(pipeline), options);

  logger.info("[GetProducts] Products fetched", {
    total: result.totalProducts,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
  });

  // Respond with paginated results
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

  // Toggle the status
  product.isSell = !product.isSell;
  await product.save();

  logger.info(`[MarkProductAsSold] Product toggled to ${product.isSell ? "sold" : "available"}`, { productId });

  res.status(200).json(
    new ApiResponse(
      200,
      product,
      `Product marked as ${product.isSell ? "sold" : "available"}.`
    )
  );
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

  let product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const {
    title,
    category,
    price,
    condition,
    description,
    postalCode,
    street,
    name,
    isBuy,
    isSell,
    quantity,
    latitude,
    longitude,
    termsAccepted,
  } = req.body;

  // ✅ Multilingual fields (merge or update en)
  const updateMultilingual = (field, value) => {
    if (value !== undefined) {
      if (typeof value === "string") {
        product[field].en = value;
      } else if (typeof value === "object") {
        product[field] = { ...product[field].toObject?.() || product[field], ...value };
      }
    }
  };

  updateMultilingual("title", title);
  updateMultilingual("category", category);
  updateMultilingual("description", description);
  updateMultilingual("name", name);

  // ✅ Scalars
  if (price !== undefined && !isNaN(price)) {
    product.price = Number(price);
  }
  if (condition) {
    product.condition = condition;
  }

  // ✅ Quantity
  if (quantity !== undefined && !isNaN(quantity)) {
    product.quantity = Number(quantity);
  }

  // ✅ Pictures
  const picturesRaw = Array.isArray(req.files?.pictures)
    ? req.files.pictures
    : req.files?.pictures
    ? [req.files.pictures]
    : [];

  if (picturesRaw.length > 0) {
    if (picturesRaw.length > 8) {
      throw new ApiError(400, "You can upload a maximum of 8 pictures.");
    }

    // delete old images
    if (product.pictures?.length) {
      product.pictures.forEach((imgPath) => {
        const fullPath = path.join(__dirname, "..", imgPath);
        fs.unlink(fullPath, (err) => {
          if (err) console.error("Error deleting old image:", fullPath, err);
        });
      });
    }

    product.pictures = picturesRaw.map((file) =>
      file.path.replace(/\\/g, "/")
    );
  }

  // ✅ Location
  if (latitude && longitude) {
    product.location = {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    };
  }
  if (postalCode) product.postalCode = postalCode;
  if (street) product.street = street;

  // ✅ Flags (convert to boolean properly)
  if (termsAccepted !== undefined) {
    product.termsAccepted = termsAccepted === "true" || termsAccepted === true;
  }
  if (isBuy !== undefined) {
    product.isBuy = isBuy === "true" || isBuy === true;
  }
  if (isSell !== undefined) {
    product.isSell = isSell === "true" || isSell === true;
  }

  // ✅ Save
  try {
    product = await product.save();
  } catch (err) {
    console.error("Mongoose Save Error:", err);
    throw new ApiError(400, err.message || "Failed to update product");
  }

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully."));
});

const getNearbyProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    minPrice,
    maxPrice,
    condition,
    city,
    search,
    category,
    latitude,
    longitude,
    radiusInKm,
  } = req.query;

  const pipeline = [];


  if (latitude && longitude) {
    const radiusInMeters = (radiusInKm || 10) * 1000; // Default 10km

    pipeline.push({
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: "distance", // Adds a 'distance' field to each doc
        maxDistance: radiusInMeters,
        spherical: true,
        distanceMultiplier: 0.001, // Optional: convert distance to km
      },
    });
  }

  // 2. Build the $match stage for all other filters
  const matchStage = {};

  if (minPrice && maxPrice) {
    matchStage.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
  }
  if (condition) {
    matchStage.condition = condition;
  }
  if (city) {
    matchStage.city = city; // Note: if using geo-search, city might be redundant
  }
  if (category) {
    matchStage["category.en"] = category; // Assuming you filter by English category name
  }
  if (search) {
    // Add your text search logic here, e.g., using a $text index
    matchStage.$text = { $search: search }; 
  }

  // 3. Add the $match stage to the pipeline if it has any filters
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // 4. Add a sort stage (e.g., sort by distance if location is used, otherwise by date)
  const sortStage = latitude && longitude ? { distance: 1 } : { createdAt: -1 };
  pipeline.push({ $sort: sortStage });


  // 5. Execute aggregation with pagination
  const aggregate = Product.aggregate(pipeline);
  const options = { /* ... your pagination options ... */ };
  const result = await Product.aggregatePaginate(aggregate, options);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Products fetched successfully."));
});
const getPriorityProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    lang = "en",
    category,
    search,
    minPrice = 0,
    maxPrice = 1000000,
  } = req.query;

  const validLangs = ["en", "az", "ru"];
  const selectedLang = validLangs.includes(lang) ? lang : "en";

  logger.info("[GetPriorityProducts] Query Params", {
    page,
    limit,
    lang: selectedLang,
    category,
    search,
    minPrice,
    maxPrice,
  });

  const pipeline = [];

  // ✅ Category filter
  if (category?.trim() && category !== "All Products") {
    pipeline.push({
      $match: {
        [`category.${selectedLang}`]: new RegExp(`^${category.trim()}$`, "i"),
      },
    });
  }

  // ✅ Search filter
  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pipeline.push({
      $match: {
        $or: [
          { [`title.${selectedLang}`]: { $regex: safeSearch, $options: "i" } },
          { [`description.${selectedLang}`]: { $regex: safeSearch, $options: "i" } },
        ],
      },
    });
  }

  // ✅ General filters
  const matchStage = {
    price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
  };

  pipeline.push({ $match: matchStage });

  // ✅ Sort: priority true first, then latest
  pipeline.push({
    $sort: { priority: -1, createdAt: -1 },
  });

  // ✅ Projection
  pipeline.push({
    $project: {
      _id: 1,
      title: { $ifNull: [`$title.${selectedLang}`, "$title.en"] },
      category: { $ifNull: [`$category.${selectedLang}`, "$category.en"] },
      description: { $ifNull: [`$description.${selectedLang}`, "$description.en"] },
      name: { $ifNull: [`$name.${selectedLang}`, "$name.en"] },
      price: 1,
      condition: 1,
      pictures: 1,
      location: 1,
      termsAccepted: 1,
      owner: 1,
      isBuy: 1,
      isSell: 1,
      priority: 1, // ✅ expose priority
      createdAt: 1,
    },
  });

  // ✅ Pagination
  const options = {
    page: Number(page),
    limit: Number(limit),
    customLabels: {
      docs: "products",
      totalDocs: "totalProducts",
      page: "currentPage",
      totalPages: "totalPages",
      hasPrevPage: "hasPrevPage",
      hasNextPage: "hasNextPage",
      prevPage: "prevPage",
      nextPage: "nextPage",
    },
  };

  // ✅ Execute with pagination
  const result = await Product.aggregatePaginate(Product.aggregate(pipeline), options);

  logger.info("[GetPriorityProducts] Products fetched", {
    total: result.totalProducts,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Fetched products with priority first."));
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
  getPriorityProducts
};