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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
<<<<<<< HEAD
    isBuy: {
      type: Boolean,
      default: false,
    },
    isSell: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
=======

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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  owner: {
    type: Date,
    default: Date.now,
  },
},
>>>>>>> d5b61aeb4e5a236ceb65da6078acf400673cb787
  { timestamps: true }

);

productSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("Product", productSchema);
