const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

const e_transactionSchema = new mongoose.Schema(
    {
        senderId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null 
        },
        type: {
            type: String,
            enum: ["credit", "debit", "refund", "transfer"],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            default: ""
        },
        transactionId: {
            type: String,
            unique: true,
            required: true
        },
        referenceId: {
            type: String,
            default: null
        },
        source: {
            type: String,
            enum: ["reward", "purchase", "referral", "admin", "transfer"],
            default: "purchase"
        },
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "success"
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);
module.exports = mongoose.model("Transaction", e_transactionSchema);