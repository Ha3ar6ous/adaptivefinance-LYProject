const mongoose = require('mongoose')

const suggestionSchema = new mongoose.Schema(
  {
    optionId: String,
    name: String,
    type: String,
    score: Number,
    allocationAmount: Number,
    allocationPct: Number,
    expectedReturnPct: Number,
    returnNote: String,
    riskLevel: String,
    liquidity: String,
    lockInPeriod: String,
    projection: {
      low: Number,
      median: Number,
      high: Number,
      note: String,
    },
    reasonTags: { type: [String], default: [] },
  },
  { _id: false },
)

const investmentSuggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    eligible: { type: Boolean, default: false },
    investableAmount: { type: Number, default: 0 },
    riskProfile: { type: String, default: 'low' },
    blockedReason: { type: String, default: '' },
    suggestions: { type: [suggestionSchema], default: [] },
    generatedAt: { type: Date },
  },
  { timestamps: true },
)

module.exports = mongoose.model('InvestmentSuggestion', investmentSuggestionSchema)

