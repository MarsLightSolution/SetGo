const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    pictures: {
      type: [String],
      validate: {
        validator: (v) => v.length <= 8,
        message: "You can upload a maximum of 8 pictures.",
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
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
    },
    name: {
      type: String,
      required: true,
      trim: true,
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

productSchema.index({ location: "2dsphere" });

productSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("Product", productSchema);
