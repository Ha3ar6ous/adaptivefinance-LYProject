require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('./models/User')
const DailyIncomeEntry = require('./models/DailyIncomeEntry')

const seedDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lyproject'
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')

    // Clear existing data
    await User.deleteMany({})
    await DailyIncomeEntry.deleteMany({})
    console.log('Cleared existing data')

    // Create a test user
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('password123', salt)

    const user = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: hashedPassword,
    })
    console.log(`Created user: ${user.email}`)

    // Generate 40 days of data
    const entries = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 39)

    for (let i = 0; i < 40; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)

      const dateString = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay()

      let hoursWorked = 0
      let ordersCompleted = 0
      let income = 0

      // 0 income on Sundays (dayOfWeek === 0)
      if (dayOfWeek === 0) {
        hoursWorked = 0
        ordersCompleted = 0
        income = 0
      }
      // 0 income on a few random days (every 10-15 days roughly)
      else if ([3, 11, 18, 29].includes(i)) {
        hoursWorked = 0
        ordersCompleted = 0
        income = 0
      }
      // Regular working days
      else {
        // Vary hours: 6-14 hours
        hoursWorked = Math.floor(Math.random() * 9) + 6
        // Orders: 8-25 per day
        ordersCompleted = Math.floor(Math.random() * 18) + 8
        // Income: ~40-80 per order for Zomato (realistic)
        const perOrderIncome = Math.floor(Math.random() * 41) + 40
        income = ordersCompleted * perOrderIncome
      }

      entries.push({
        userId: user._id,
        date: dateString,
        platform: 'Zomato',
        hours_worked: hoursWorked,
        orders_completed: ordersCompleted,
        income: income,
      })
    }

    await DailyIncomeEntry.insertMany(entries)
    console.log(`Created ${entries.length} daily income entries`)

    // Print summary
    const totalIncome = entries.reduce((sum, e) => sum + e.income, 0)
    const workingDays = entries.filter((e) => e.income > 0).length
    const avgHours =
      entries.reduce((sum, e) => sum + e.hours_worked, 0) / workingDays

    console.log('\n=== SEED SUMMARY ===')
    console.log(`Email: ${user.email}`)
    console.log(`Password: password123`)
    console.log(`Total income (40 days): ₹${totalIncome}`)
    console.log(`Working days: ${workingDays}`)
    console.log(`Average hours/working day: ${avgHours.toFixed(2)}`)
    console.log(
      `Date range: ${entries[0].date} to ${entries[entries.length - 1].date}`,
    )

    await mongoose.connection.close()
    console.log('\nDatabase seeded successfully!')
  } catch (err) {
    console.error('Error seeding database:', err)
    process.exit(1)
  }
}

seedDatabase()
