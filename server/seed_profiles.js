require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('./models/User')
const DailyIncomeEntry = require('./models/DailyIncomeEntry')
const IncomeAnalytics = require('./models/IncomeAnalytics')

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adaptive-finance')
  
  const passwordHash = await bcrypt.hash('password', 10)

  // 1. Aditya Singh - Good Profile
  let aditya = await User.findOne({ email: 'aditya.s@gmail.com' })
  if (!aditya) {
    aditya = new User({
      name: 'Aditya Singh',
      email: 'aditya.s@gmail.com',
      password: passwordHash,
    })
  } else {
      aditya.password = passwordHash;
  }
  aditya.hasCompletedOnboarding = true
  aditya.bankBalance = 85000
  aditya.monthlyExpenses = 25000
  aditya.debts = 0
  aditya.investments = 15000
  aditya.riskPreference = 'medium'
  await aditya.save()

  // 2. Vikram Gupta - Bad Profile
  let vikram = await User.findOne({ email: 'vikram.g@gmail.com' })
  if (!vikram) {
    vikram = new User({
      name: 'Vikram Gupta',
      email: 'vikram.g@gmail.com',
      password: passwordHash,
    })
  } else {
      vikram.password = passwordHash;
  }
  vikram.hasCompletedOnboarding = true
  vikram.bankBalance = 1500
  vikram.monthlyExpenses = 30000
  vikram.debts = 60000
  vikram.investments = 0
  vikram.riskPreference = 'low'
  await vikram.save()

  // Clear old entries
  await DailyIncomeEntry.deleteMany({ userId: { $in: [aditya._id, vikram._id] } })
  await IncomeAnalytics.deleteMany({ userId: { $in: [aditya._id, vikram._id] } })

  const today = new Date()
  const adityaEntries = []
  const vikramEntries = []

  for (let i = 60; i >= 1; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    
    // Aditya: High, stable income
    const adityaIncome = Math.floor(Math.random() * 500) + 2000 // 2000-2499 consistently
    adityaEntries.push({
      userId: aditya._id,
      date: d,
      income: adityaIncome,
      hours_worked: 6,
      orders_completed: 10,
      platform: 'Swiggy'
    })

    // Vikram: Low, highly volatile income
    let vikramIncome = 0
    const rand = Math.random()
    if (rand > 0.4) { // 60% chance of getting some work
        if (rand > 0.8) {
            vikramIncome = Math.floor(Math.random() * 300) + 1000 // 1000-1299
        } else {
            vikramIncome = Math.floor(Math.random() * 400) + 100 // 100-499
        }
    }
    
    if (vikramIncome > 0) {
        vikramEntries.push({
          userId: vikram._id,
          date: d,
          income: vikramIncome,
          hours_worked: Math.floor(vikramIncome / 100) || 1,
          orders_completed: Math.floor(vikramIncome / 50) || 1,
          platform: 'Zomato'
        })
    }
  }

  await DailyIncomeEntry.insertMany(adityaEntries)
  await DailyIncomeEntry.insertMany(vikramEntries)
  
  console.log('Seeded Aditya Singh (Good Profile) and Vikram Gupta (Bad Profile)')
  process.exit(0)
}

run().catch(console.error)
