// Guards for the /api/v2 routes. They run in front of the existing controllers, which are
// reused unchanged: identity always comes from the verified token (req.user), never from
// ids the client sends.
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const Order = require("../models/Order");
const Product = require("../models/product.model");
const Shop = require("../models/Shop");

const isAdmin = (req) => req.user?.role === "admin";
const sameId = (a, b) => a != null && b != null && String(a._id || a) === String(b._id || b);
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const deny = (res, message = "Not allowed") => res.status(403).json({ success: false, message });

// Logged-in admins only (put after verifyJWT).
const adminOnly = (req, res, next) => (isAdmin(req) ? next() : deny(res, "Admin access required"));

// req.params[param] must be the logged-in user (or the caller is an admin).
const selfOrAdmin = (param = "id") => (req, res, next) =>
  sameId(req.params[param], req.user?._id) || isAdmin(req) ? next() : deny(res, "You can only access your own account.");

// Overwrite these body/query fields with the logged-in user's id (or another req.user field),
// so the existing controllers' "is this yours" checks run against the real caller.
// asSelf("buyerId")              → body.buyerId = query.buyerId = user id
// asSelf({ email: "email" })     → body.email = query.email = req.user.email
const asSelf = (fields) => (req, res, next) => {
  const map = typeof fields === "string" ? { [fields]: "_id" }
    : Array.isArray(fields) ? Object.fromEntries(fields.map((f) => [f, "_id"]))
    : fields;
  req.body = req.body || {};
  for (const [field, source] of Object.entries(map)) {
    const value = String(req.user[source]);
    req.body[field] = value;
    if (req.query) req.query[field] = value;
  }
  next();
};

// Order guards. param = name of the route param holding the order id.
const loadOrder = async (req, res, param) => {
  const id = req.params[param];
  if (!isObjectId(id)) {
    res.status(400).json({ success: false, message: "Invalid order id" });
    return null;
  }
  const order = await Order.findById(id, "buyerId sellerId").lean();
  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return null;
  }
  return order;
};
const orderParticipantOrAdmin = (param = "id") => async (req, res, next) => {
  try {
    const order = await loadOrder(req, res, param);
    if (!order) return undefined;
    if (sameId(order.buyerId, req.user._id) || sameId(order.sellerId, req.user._id) || isAdmin(req)) return next();
    return deny(res, "Not allowed to access this order");
  } catch (err) {
    return next(err);
  }
};
const orderSellerOrAdmin = (param = "orderId") => async (req, res, next) => {
  try {
    const order = await loadOrder(req, res, param);
    if (!order) return undefined;
    if (sameId(order.sellerId, req.user._id) || isAdmin(req)) return next();
    return deny(res, "Only the seller can update this order");
  } catch (err) {
    return next(err);
  }
};

// Product guards.
const productOwnerOrAdmin = (param = "id") => async (req, res, next) => {
  try {
    const id = req.params[param];
    if (!isObjectId(id)) return res.status(400).json({ success: false, message: "Invalid product ID" });
    const product = await Product.findById(id, "owner").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (isAdmin(req) || sameId(product.owner, req.user._id)) return next();
    return deny(res, "You can only change your own ads.");
  } catch (err) {
    return next(err);
  }
};

// If a shop is sent (new listing or update), it must belong to the caller (admins: any shop).
// Runs after multer, so req.body is populated.
const ownShopIfAny = async (req, res, next) => {
  try {
    const shop = req.body?.shop;
    if (!shop || isAdmin(req)) return next();
    if (!isObjectId(shop)) return res.status(400).json({ success: false, message: "Invalid shop ID." });
    const shopDoc = await Shop.findById(shop, "owner").lean();
    if (!shopDoc) return res.status(400).json({ success: false, message: "Shop not found." });
    if (!sameId(shopDoc.owner, req.user._id)) return deny(res, "You can only list products in your own shop.");
    return next();
  } catch (err) {
    return next(err);
  }
};

const limiter = (max, windowMinutes = 15) =>
  rateLimit({ windowMs: windowMinutes * 60 * 1000, max, standardHeaders: true, legacyHeaders: false });

module.exports = {
  isAdmin,
  sameId,
  isObjectId,
  adminOnly,
  selfOrAdmin,
  asSelf,
  orderParticipantOrAdmin,
  orderSellerOrAdmin,
  productOwnerOrAdmin,
  ownShopIfAny,
  limiter,
};
