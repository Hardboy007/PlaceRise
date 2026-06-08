const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./config/db')

dotenv.config()

connectDB()

const app = express()
app.use(express.json())
app.use(cors())

const authRoutes = require('./routes/auth')

app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'PlaceRise Backend Running' })
})

const PORT = process.env.PORT || 5000

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((error) => {
  console.error('Failed to connect to database:', error.message)
  process.exit(1)
})