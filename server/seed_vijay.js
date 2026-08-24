require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('./models/User')
const DailyIncomeEntry = require('./models/DailyIncomeEntry')
const IncomeAnalytics = require('./models/IncomeAnalytics')

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adaptive-finance')
  
  const email = 'vijay.k@gmail.com'
  const name = 'vijay kumar'
  const password = 'password'
  
  let user = await User.findOne({ email })
  if (!user) {
    console.log('User not found. Creating user...')
    const hashedPassword = await bcrypt.hash(password, 10)
    user = await User.create({ 
        name, 
        email, 
        password: hashedPassword,
    })
  }

  // Update profile
  // Earning really good but unstably
  // Debt ridden
  // Minimal money in bank
  user.hasCompletedOnboarding = true;
  user.bankBalance = 2500; // Minimal money
  user.debts = 800000; // Debt ridden
  user.monthlyExpenses = 25000;
  user.investments = 0;
  await user.save();

  console.log('User profile updated:', user.name, user.email)

  // clear old entries
  await DailyIncomeEntry.deleteMany({ userId: user._id })
  await IncomeAnalytics.deleteMany({ userId: user._id })

  // Insert 70 days of high income, high volatility data
  const entries = []
  const today = new Date()
  
  // Set time to noon to avoid timezone issues
  today.setHours(12, 0, 0, 0)
  
  for (let i = 70; i >= 1; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    
    // high variance: sometimes really good, sometimes 0
    // 30% chance 0 (no work)
    // 30% chance 800 - 1500 (low day)
    // 40% chance 4000 - 8000 (high day)
    
    let income = 0
    const rand = Math.random()
    if (rand > 0.3) {
        if (rand > 0.6) {
            income = Math.floor(Math.random() * 4000) + 4000 // 4000-7999
        } else {
            income = Math.floor(Math.random() * 700) + 800 // 800-1499
        }
    }
    
    if (income > 0) {
        entries.push({
          userId: user._id,
          date: d,
          income,
          hours_worked: Math.floor(income / 500) || 1, // rough estimate
          orders_completed: Math.floor(income / 200) || 1,
          platform: 'Freelance'
        })
    }
  }

  await DailyIncomeEntry.insertMany(entries)
  console.log(`Inserted ${entries.length} entries for the last 70 days.`)
  
  process.exit(0)
}

run().catch(console.error)
