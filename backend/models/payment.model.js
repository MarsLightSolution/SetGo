const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  referenceId: {
    type:String,
    unique: true
  },
  userId: String,
  receiverId:String,
  amount: Number,
  status: { type: String, default: 'PENDING' },
  paymentwallData: Object,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Payment', paymentSchema);