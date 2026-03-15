const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    bankBalance: {
      type: Number,
      default: 0,
    },
    monthlyExpenses: {
      type: Number,
      default: 0,
    },
    debts: {
      type: Number,
      default: 0,
    },
    investments: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)
