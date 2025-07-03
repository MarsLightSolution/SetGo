const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');


const productSchema = new mongoose.Schema({
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
      validator: function (v) {
        return v.length <= 20;
      },
      message: 'You can upload a maximum of 20 pictures.',
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
      default: '',
      trim: true,
    }
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
  createdAt: {
    type: Date,
    default: Date.now,
  }
});
productSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Product', productSchema);
