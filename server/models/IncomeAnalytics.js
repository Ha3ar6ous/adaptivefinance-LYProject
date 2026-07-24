const mongoose = require('mongoose')

const forecastPointSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    income: { type: Number, required: true },
  },
  { _id: false },
)

const incomeAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    forecast: {
      horizon: { type: Number, default: 15 },
      points: { type: [forecastPointSchema], default: [] },
      method: { type: String, default: 'insufficient_data' },
      note: { type: String, default: '' },
      generatedAt: { type: Date },
    },
    volatility: {
      label: { type: String, default: 'unknown' },
      score: { type: Number, default: 0 },
      features: { type: mongoose.Schema.Types.Mixed, default: {} },
      note: { type: String, default: '' },
      generatedAt: { type: Date },
    },
    entryCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ready', 'insufficient_data', 'error'],
      default: 'insufficient_data',
    },
    error: { type: String, default: '' },
  },
  { timestamps: true },
)

module.exports = mongoose.model('IncomeAnalytics', incomeAnalyticsSchema)

