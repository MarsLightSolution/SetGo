// /api/v2/catalog handlers: public reads. New code; the original controllers are unchanged.
const mongoose = require("mongoose");
const Shop = require("../../models/Shop");
const Product = require("../../models/product.model");
const logger = require("../../utils/logger");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LANGS = ["en", "az", "ru"];

// GET /api/v2/catalog/category/:category?limit=
// Same response as /api/products/category/:category, but:
// - the category text is matched as plain text (the old route built a regex from the URL,
//   so a crafted category could stall the server);
// - it matches category.en / .az / .ru (categories are stored per language; the old route
//   compared against the whole object and never matched).
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = String(req.params.category || "").trim();
    if (!category || category.length > 100) {
      return res.status(400).json({ statusCode: 400, success: false, data: null, message: "Category is required" });
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const exact = new RegExp(`^${escapeRegex(category)}$`, "i");

    const products = await Product.find({
      $or: LANGS.map((l) => ({ [`category.${l}`]: exact })),
      isSell: false,
      quantity: { $gt: 0 },
    })
      .populate({ path: "shop", select: "shopName slug logo isVerified" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ statusCode: 200, success: true, data: products, message: "Fetched products by category" });
  } catch (err) {
    logger.error("[v2 catalog] getProductsByCategory", { message: err.message });
    return res.status(500).json({ statusCode: 500, success: false, data: null, message: "Failed to fetch products" });
  }
};

// GET /api/v2/catalog/shops/:idOrSlug
// Same response as /api/shops/:id, but the owner is shown by name only: the old route also
// sent the owner's personal email and phone number to anyone. The shop's own contact
// details (contactEmail / contactPhone) are still included.
exports.getShop = async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id.toLowerCase() };

    const shop = await Shop.findOne({ ...query, status: { $ne: "closed" } })
      .populate("owner", "username profileName")
      .lean();
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found." });

    Shop.findByIdAndUpdate(shop._id, { $inc: { totalViews: 1 } }).exec().catch(() => {});

    const products = await Product.find({ shop: shop._id, isSell: false })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("title price pictures condition createdAt")
      .lean();

    return res.status(200).json({ success: true, data: { ...shop, products } });
  } catch (err) {
    logger.error("[v2 catalog] getShop", { message: err.message });
    return res.status(500).json({ success: false, message: "Failed to fetch shop." });
  }
};
