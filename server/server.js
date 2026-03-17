require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const dataRoutes = require('./routes/dataRoutes')

const app = express()

app.use(
  cors({
    exposedHeaders: ['Content-Disposition'],
  }),
)
app.use(express.json())

connectDB()

app.get('/', (req, res) => {
  res.send('Backend is working')
})

app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)

app.get('/api/test', (req, res) => {
  res.json({ message: 'API working correctly' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
