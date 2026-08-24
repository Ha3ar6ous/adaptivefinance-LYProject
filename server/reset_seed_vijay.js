require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const DailyIncomeEntry = require('./models/DailyIncomeEntry')
const IncomeAnalytics = require('./models/IncomeAnalytics')

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adaptive-finance')
  
  const email = 'vijay.k@gmail.com'
  
  const user = await User.findOne({ email })
  if (!user) {
    console.log('User not found. Nothing to reset.')
    process.exit(0)
  }

  console.log(`Resetting data for user: ${user.name} (${user.email})`)

  // Reset profile data to 0
  user.bankBalance = 0;
  user.debts = 0;
  user.monthlyExpenses = 0;
  user.investments = 0;
  user.hasCompletedOnboarding = false; // Optionally reset onboarding status if you want to show that flow too
  await user.save();

  console.log('User profile reset to 0.')

  // Clear all income entries and analytics
  await DailyIncomeEntry.deleteMany({ userId: user._id })
  await IncomeAnalytics.deleteMany({ userId: user._id })

  console.log('All income entries and analytics have been deleted.')
  
  process.exit(0)
}

run().catch(console.error)
