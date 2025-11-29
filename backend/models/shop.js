const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const shopSchema = new mongoose.Schema(
  {
    // ============ BASIC INFO ============
    shopName: {
      en: { type: String, required: true, trim: true, maxlength: 100 },
      az: { type: String, trim: true, maxlength: 100 },
      ru: { type: String, trim: true, maxlength: 100 },
    },
    
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: {
      en: { type: String, maxlength: 2000, default: "" },
      az: { type: String, maxlength: 2000, default: "" },
      ru: { type: String, maxlength: 2000, default: "" },
    },

    // ============ BRANDING ============
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },

    // ============ OWNER ============
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ============ CONTACT ============
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },

    // ============ LOCATION ============
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "Azerbaijan" },
    },

    // ============ CATEGORY ============
    category: {
      type: String,
      enum: [
        "Electronics",
        "Clothing & Fashion",
        "Home & Garden",
        "Vehicles",
        "Sports & Outdoors",
        "Books & Media",
        "Services",
        "General",
        "Other",
      ],
      default: "General",
      index: true,
    },

    // ============ STATUS ============
    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
      index: true,
    },
    isVerified: { type: Boolean, default: false },

    // ============ STATS ============
    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },

    // ============ FOLLOWERS ============
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ============ SETTINGS ============
    settings: {
      deliveryAvailable: { type: Boolean, default: false },
      pickupAvailable: { type: Boolean, default: true },
      workingHours: { type: String, maxlength: 200, default: "" },
      shippingInfo: {
        en: { type: String, maxlength: 500, default: "" },
        az: { type: String, maxlength: 500, default: "" },
        ru: { type: String, maxlength: 500, default: "" },
      },
    },

    // ============ SOCIAL LINKS ============
    socialLinks: {
      instagram: { type: String, trim: true, default: "" },
      facebook: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      telegram: { type: String, trim: true, default: "" },
      whatsapp: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

// ============ INDEXES ============
shopSchema.index({ location: "2dsphere" });
shopSchema.index({ category: 1, status: 1 });
shopSchema.index({ createdAt: -1 });

// ============ PRE-SAVE: Generate Slug ============
shopSchema.pre("save", async function (next) {
  if (this.isModified("shopName") || !this.slug) {
    let baseSlug = this.shopName.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;
    
    while (await mongoose.models.Shop.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  next();
});

// ============ METHODS ============
shopSchema.methods.updateProductCount = async function () {
  const Product = mongoose.model("Product");
  const count = await Product.countDocuments({ shop: this._id });
  this.totalProducts = count;
  await this.save();
};

// ============ STATICS ============
shopSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, status: "active" });
};

shopSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("Shop", shopSchema);