const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'supersecretjwtkey',
    { expiresIn: '7d' },
  )
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashedPassword })

    const token = generateToken(user)
    res
      .status(201)
      .json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      })
  } catch (error) {
    console.error('Signup error', error)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('Login error', error)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const user = await User.findById(req.user.id).select('-password')
  res.json({ user })
}
