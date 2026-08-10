const mongoose = require('mongoose')

const aiExplanationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    overview: {
      headline: { type: String, default: '' },
      summary: { type: String, default: '' },
      nextAction: { type: String, default: '' },
    },
    healthInsight: { type: String, default: '' },
    forecastInsight: { type: String, default: '' },
    decisionInsight: { type: String, default: '' },
    investmentInsight: { type: String, default: '' },
    reasons: { type: [String], default: [] },
    actionPlan: {
      type: [
        {
          title: String,
          detail: String,
        },
      ],
      default: [],
    },
    watchOut: { type: String, default: '' },
    tone: {
      type: String,
      enum: ['safe', 'caution', 'growth'],
      default: 'caution',
    },
    sourceSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['ready', 'fallback', 'error'],
      default: 'fallback',
    },
    error: { type: String, default: '' },
    generatedAt: { type: Date },
  },
  { timestamps: true },
)

module.exports = mongoose.model('AiExplanation', aiExplanationSchema)
