const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const productSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true, trim: true, maxlength: 200 },
      de: { type: String, trim: true, maxlength: 200 },
    },
    category: {
      en: { type: String, required: true, trim: true, index: true },
      de: { type: String, trim: true, index: true },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      en: { type: String, required: true, trim: true, maxlength: 4000 },
      de: { type: String, trim: true, maxlength: 4000 },
    },
    pictures: {
      type: [String],
      validate: {
        validator: (v) => v.length <= 8,
        message: "You can upload a maximum of 8 pictures.",
      },
    },
    location: {
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
    },
    name: {
      en: { type: String, required: true, trim: true },
      de: { type: String, trim: true },
    },
    termsAccepted: {
      type: Boolean,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },

    isBuy: {
      type: Boolean,
      default: false
    },
    isSell: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Date,
      default: Date.now,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  { timestamps: true }
);

productSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("Product", productSchema);
