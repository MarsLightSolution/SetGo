const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const productSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true, trim: true, maxlength: 200 },
      az: { type: String, trim: true, maxlength: 200 },
      ru: { type: String, trim: true, maxlength: 200 },
    },
    category: {
      en: { type: String, required: true, trim: true, index: true },
      az: { type: String, trim: true, index: true },
      ru: { type: String, trim: true, index: true },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      en: { type: String, required: true, trim: true, maxlength: 4000 },
      az: { type: String, trim: true, maxlength: 4000 },
      ru: { type: String, trim: true, maxlength: 4000 },
    },
    pictures: {
      type: [String],
      validate: {
        validator: (v) => v.length <= 8,
        message: "You can upload a maximum of 8 pictures.",
      },
    },
    condition: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: ["New", "Like New", "Used", "Defective / Needs Repair"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
        default: [0, 0]
      }
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      en: { type: String, required: true, trim: true },
      az: { type: String, trim: true },
      ru: { type: String, trim: true },
    },
    termsAccepted: {
      type: Boolean,
      required: true,
    },
    isBuy: {
      type: Boolean,
      default: false,
    },
    isSell: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Boolean,
      default: false, // ✅ false by default, admin can set to true
      index: true,    // ✅ index for faster queries
    },
    createdBy: {
      type: Date,
      default: Date.now,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for Geo Queries
productSchema.index({ location: "2dsphere" });

productSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("Product", productSchema);
