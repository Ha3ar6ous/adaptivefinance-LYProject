require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const DailyIncomeEntry = require('./models/DailyIncomeEntry')
const IncomeAnalytics = require('./models/IncomeAnalytics')

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adaptive-finance')
  
  const user = await User.findOne({ name: /chamunda/i })
  if (!user) {
    console.log('User not found')
    process.exit(1)
  }

  console.log('Found user:', user.name, user._id)

  // clear old entries
  await DailyIncomeEntry.deleteMany({ userId: user._id })
  await IncomeAnalytics.deleteMany({ userId: user._id })

  // Insert 60 days of high volatility data
  const entries = []
  const today = new Date()
  
  for (let i = 60; i >= 1; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    
    // high volatility: sometimes 300, sometimes 1500, sometimes 0 (not working)
    // Let's create a pattern:
    // 20% chance 0
    // 40% chance 300 - 600
    // 40% chance 1000 - 1800
    
    let income = 0
    const rand = Math.random()
    if (rand > 0.2) {
        if (rand > 0.6) {
            income = Math.floor(Math.random() * 800) + 1000 // 1000-1799
        } else {
            income = Math.floor(Math.random() * 300) + 300 // 300-599
        }
    }
    
    if (income > 0) {
        entries.push({
          userId: user._id,
          date: d,
          income,
          hours_worked: Math.floor(income / 150) || 1, // rough estimate
          orders_completed: Math.floor(income / 50) || 1,
          platform: 'Swiggy'
        })
    }
  }

  await DailyIncomeEntry.insertMany(entries)
  console.log(`Inserted ${entries.length} entries.`)
  
  process.exit(0)
}

run().catch(console.error)
