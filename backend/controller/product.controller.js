// controllers/product.controller.js
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const Product = require("../models/product.model");
const User = require("../models/user");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const axios = require("axios")

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

  const translateText = async (text) => {
    const response = await axios.post("http://localhost:5000/translate", {
      q: text,
      source: "en",
      target: "de"
    }, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data.translatedText;
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
    pictures: "",
    location: {
      postalCode: postalCode || "",
      street: streetNo || "",
    },
    name: { en: name, de: translatedName },
    termsAccepted: termsAccepted === true || termsAccepted === "true",
    offerType,
    showFullAddress: showFullAddress === "true" || showFullAddress === true,
    subscribe: subscribe === "true" || subscribe === true,
    isBuy: isBuy === "true" || isBuy === true,
    isSell: isSell === "true" || isSell === true,
    owner: req.user?._id || "" // ✅ if you have user auth
  });

  logger.info(`[AddProduct] Product created`, { productId: product._id });

  res.status(201).json(new ApiResponse(201, product, "Product added successfully."));
});


const getProducts = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10, lang = "en" } = req.query;


  const validLangs = ["en", "de"];
  const selectedLang = validLangs.includes(lang) ? lang : "en";

  logger.info(`[GetProducts] Query`, { category, page, limit, lang: selectedLang });

  const pipeline = [];

  if (category?.trim()) {
    pipeline.push({
      $match: {
        category: new RegExp(`^${category.trim()}$`, "i"),
      },
    });
    logger.info(`[GetProducts] Filter applied for category`, { category });
  }

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

  logger.info(`[GetProducts] Retrieved products`, { total: result.totalProducts });

  result.products = result.products.map(prod => ({
    _id: prod._id,
    title: prod.title[selectedLang] || prod.title.en,
    category: prod.category[selectedLang] || prod.category.en,
    price: prod.price,
    description: prod.description[selectedLang] || prod.description.en,
    pictures: prod.pictures,
    location: prod.location,
    name: prod.name[selectedLang] || prod.name.en,
    termsAccepted: prod.termsAccepted,
    owner: prod.owner,
    isBuy: prod.isBuy,
    isSell: prod.isSell,
    createdAt: prod.createdAt,
    updatedAt: prod.updatedAt
  }));

  logger.info(`[GetProducts] Retrieved products`, { total: result.totalProducts });

  res.status(200).json(new ApiResponse(200, result, "Filtered products with pagination."));
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { lang = "en" } = req.query;

  const validLangs = ["en", "de"];
  const selectedLang = validLangs.includes(lang) ? lang : "en";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    logger.warn(`[GetProductById] Invalid ID`, { id });
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(id);

  if (!product) {
    logger.warn(`[GetProductById] Product not found`, { id });
    throw new ApiError(404, "Product not found");
  }

  const productResponse = {
    _id: product._id,
    title: product.title[selectedLang] || product.title.en,
    category: product.category[selectedLang] || product.category.en,
    price: product.price,
    description: product.description[selectedLang] || product.description.en,
    pictures: product.pictures,
    location: product.location,
    name: product.name[selectedLang] || product.name.en,
    termsAccepted: product.termsAccepted,
    owner: product.owner,
    isBuy: product.isBuy,
    isSell: product.isSell,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  logger.info(`[GetProductById] Product found`, { id });

  res.status(200).json(new ApiResponse(200, productResponse, "Fetched product by ID"));
});

module.exports = { addProduct, getProducts, getProductById };
