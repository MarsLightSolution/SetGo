const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: ["left", "right", "banner", "inline"],
      required: true,
      default: "left",
    },
    link: {
      type: String,
      default: "",
    },
    linkTarget: {
      type: String,
      enum: ["_blank", "_self"],
      default: "_blank",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", adSchema);
