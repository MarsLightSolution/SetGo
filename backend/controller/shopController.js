const Shop = require("../models/Shop");
const User = require("../models/user");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

// =====================================================
// CREATE SHOP
// POST /api/shops
// =====================================================
const createShop = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user already has a shop
    const existingShop = await Shop.findOne({ owner: userId });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: "You already have a shop. Each user can only have one shop.",
      });
    }

    const {
      shopName,
      description,
      category,
      contactEmail,
      contactPhone,
      address,
      location,
      settings,
      socialLinks,
    } = req.body;

    // Validate required fields
    if (!shopName?.en && !req.body.shopName) {
      return res.status(400).json({
        success: false,
        message: "Shop name in English is required.",
      });
    }

    // Handle file uploads (logo and banner)
    let logo = "";
    let banner = "";
    
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        logo = `/uploads/shop/${req.files.logo[0].filename}`;
      }
      if (req.files.banner && req.files.banner[0]) {
        banner = `/uploads/shop/${req.files.banner[0].filename}`;
      }
    }

    // Parse JSON strings if sent as form data
    let parsedShopName = shopName;
    let parsedDescription = description;
    let parsedAddress = address;
    let parsedSettings = settings;
    let parsedSocialLinks = socialLinks;
    let parsedLocation = location;

    try {
      if (typeof shopName === 'string') parsedShopName = JSON.parse(shopName);
      if (typeof description === 'string') parsedDescription = JSON.parse(description);
      if (typeof address === 'string') parsedAddress = JSON.parse(address);
      if (typeof settings === 'string') parsedSettings = JSON.parse(settings);
      if (typeof socialLinks === 'string') parsedSocialLinks = JSON.parse(socialLinks);
      if (typeof location === 'string') parsedLocation = JSON.parse(location);
    } catch (e) {
      // If parsing fails, use as-is
    }

    // Create shop
    const shop = new Shop({
      shopName: parsedShopName,
      description: parsedDescription || { en: "", az: "", ru: "" },
      category: category || "General",
      owner: userId,
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phoneNumber || "",
      address: parsedAddress || {},
      location: parsedLocation || { type: "Point", coordinates: [0, 0] },
      logo,
      banner,
      settings: parsedSettings || {},
      socialLinks: parsedSocialLinks || {},
      status: "active",
    });

    await shop.save();

    // Update user with shop reference
    await User.findByIdAndUpdate(userId, {
      shop: shop._id,
      hasShop: true,
    });

    res.status(201).json({
      success: true,
      message: "Shop created successfully!",
      data: shop,
    });
  } catch (error) {
    console.error("Error creating shop:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A shop with similar name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create shop.",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY SHOP (Current user's shop)
// GET /api/shops/my-shop
// =====================================================
const getMyShop = async (req, res) => {
  try {
    const userId = req.user._id;

    const shop = await Shop.findOne({ owner: userId }).lean();

    if (!shop) {
      return res.status(200).json({
        success: true,
        hasShop: false,
        message: "You don't have a shop yet.",
        data: null,
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({ shop: shop._id });

    res.status(200).json({
      success: true,
      hasShop: true,
      data: {
        ...shop,
        totalProducts: productCount,
      },
    });
  } catch (error) {
    console.error("Error getting my shop:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your shop.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL SHOPS (Public listing)
// GET /api/shops
// =====================================================
const getAllShops = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build match conditions
    const matchConditions = { status: "active" };

    if (category && category !== "all") {
      matchConditions.category = category;
    }

    if (search) {
      matchConditions.$or = [
        { "shopName.en": { $regex: search, $options: "i" } },
        { "shopName.az": { $regex: search, $options: "i" } },
        { "shopName.ru": { $regex: search, $options: "i" } },
        { "description.en": { $regex: search, $options: "i" } },
      ];
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
          pipeline: [{ $project: { username: 1, profileName: 1 } }],
        },
      },
      { $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true } },
      { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },
      {
        $project: {
          shopName: 1,
          slug: 1,
          description: 1,
          logo: 1,
          banner: 1,
          category: 1,
          totalProducts: 1,
          followerCount: 1,
          isVerified: 1,
          "address.city": 1,
          ownerDetails: 1,
          createdAt: 1,
        },
      },
    ];

    const aggregate = Shop.aggregate(pipeline);
    const result = await Shop.aggregatePaginate(aggregate, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalShops: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error getting shops:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shops.",
      error: error.message,
    });
  }
};

// =====================================================
// GET SHOP BY ID OR SLUG (Public view)
// GET /api/shops/:identifier
// =====================================================
const getShopById = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is ObjectId or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId
      ? { _id: identifier }
      : { slug: identifier.toLowerCase() };

    const shop = await Shop.findOne({ ...query, status: { $ne: "closed" } })
      .populate("owner", "username profileName email phoneNumber")
      .lean();

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Increment view count (async, don't wait)
    Shop.findByIdAndUpdate(shop._id, { $inc: { totalViews: 1 } }).exec();

    // Get shop products
    const products = await Product.find({ shop: shop._id, isSell: false })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("title price pictures condition createdAt")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...shop,
        products,
      },
    });
  } catch (error) {
    console.error("Error getting shop:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shop.",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE SHOP
// PUT /api/shops/:id
// =====================================================
const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Check ownership
    if (shop.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this shop.",
      });
    }

    const {
      shopName,
      description,
      category,
      contactEmail,
      contactPhone,
      address,
      location,
      settings,
      socialLinks,
    } = req.body;

    // Parse and update fields if provided
    try {
      if (shopName) {
        shop.shopName = typeof shopName === 'string' ? JSON.parse(shopName) : shopName;
      }
      if (description) {
        shop.description = typeof description === 'string' ? JSON.parse(description) : description;
      }
      if (category) shop.category = category;
      if (contactEmail) shop.contactEmail = contactEmail;
      if (contactPhone) shop.contactPhone = contactPhone;
      if (address) {
        const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
        shop.address = { ...shop.address, ...parsedAddress };
      }
      if (location) {
        shop.location = typeof location === 'string' ? JSON.parse(location) : location;
      }
      if (settings) {
        const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
        shop.settings = { ...shop.settings, ...parsedSettings };
      }
      if (socialLinks) {
        const parsedSocialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
        shop.socialLinks = { ...shop.socialLinks, ...parsedSocialLinks };
      }
    } catch (e) {
      // If parsing fails, ignore that field
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        shop.logo = `/uploads/shop/${req.files.logo[0].filename}`;
      }
      if (req.files.banner && req.files.banner[0]) {
        shop.banner = `/uploads/shop/${req.files.banner[0].filename}`;
      }
    }

    await shop.save();

    res.status(200).json({
      success: true,
      message: "Shop updated successfully!",
      data: shop,
    });
  } catch (error) {
    console.error("Error updating shop:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update shop.",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE/CLOSE SHOP
// DELETE /api/shops/:id
// =====================================================
const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Check ownership
    if (shop.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this shop.",
      });
    }

    // Soft delete - change status to closed
    shop.status = "closed";
    await shop.save();

    // Update user
    await User.findByIdAndUpdate(userId, {
      hasShop: false,
      shop: null,
    });

    // Update all shop products to individual listings
    await Product.updateMany(
      { shop: id },
      { $set: { shop: null, listingType: "individual" } }
    );

    res.status(200).json({
      success: true,
      message: "Shop closed successfully.",
    });
  } catch (error) {
    console.error("Error deleting shop:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete shop.",
      error: error.message,
    });
  }
};

// =====================================================
// GET SHOP PRODUCTS
// GET /api/shops/:id/products
// =====================================================
const getShopProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 12,
      category,
      condition,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Verify shop exists
    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Build match conditions
    const matchConditions = {
      shop: new mongoose.Types.ObjectId(id),
      isSell: false,
    };

    if (category) {
      matchConditions["category.en"] = category;
    }
    if (condition) {
      matchConditions.condition = condition;
    }

    const pipeline = [
      { $match: matchConditions },
      { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },
      {
        $project: {
          title: 1,
          price: 1,
          pictures: 1,
          condition: 1,
          category: 1,
          createdAt: 1,
        },
      },
    ];

    const aggregate = Product.aggregate(pipeline);
    const result = await Product.aggregatePaginate(aggregate, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalProducts: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error getting shop products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shop products.",
      error: error.message,
    });
  }
};

// =====================================================
// FOLLOW/UNFOLLOW SHOP
// POST /api/shops/:id/follow
// =====================================================
const toggleFollowShop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Can't follow own shop
    if (shop.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow your own shop.",
      });
    }

    const isFollowing = shop.followers.some(
      (followerId) => followerId.toString() === userId.toString()
    );

    if (isFollowing) {
      // Unfollow
      shop.followers = shop.followers.filter(
        (followerId) => followerId.toString() !== userId.toString()
      );
      shop.followerCount = Math.max(0, shop.followerCount - 1);
    } else {
      // Follow
      shop.followers.push(userId);
      shop.followerCount += 1;
    }

    await shop.save();

    res.status(200).json({
      success: true,
      message: isFollowing ? "Unfollowed shop." : "Following shop!",
      isFollowing: !isFollowing,
      followerCount: shop.followerCount,
    });
  } catch (error) {
    console.error("Error toggling follow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update follow status.",
      error: error.message,
    });
  }
};

module.exports = {
  createShop,
  getMyShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  getShopProducts,
  toggleFollowShop,
};