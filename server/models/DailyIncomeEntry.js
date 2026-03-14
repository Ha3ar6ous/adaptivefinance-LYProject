const mongoose = require('mongoose')

const dailyIncomeEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
    },
    hours_worked: {
      type: Number,
      required: true,
      min: 0,
    },
    orders_completed: {
      type: Number,
      required: true,
      min: 0,
    },
    income: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

dailyIncomeEntrySchema.index({ userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('DailyIncomeEntry', dailyIncomeEntrySchema)
