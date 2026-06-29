const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./config/db')

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

const authRoutes = require('./routes/auth')
const studentRoutes = require('./routes/student')
const companyRoutes = require('./routes/company')
const announcementRoutes = require('./routes/announcement')
const applicationRoutes = require('./routes/application')
const jobRoutes = require('./routes/jobs')
const coordinatorRoutes = require('./routes/coordinators')

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/coordinators', coordinatorRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'PlaceRise Backend Running' })
})

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((error) => {
  console.error('Failed to connect to database:', error.message)
  process.exit(1)
})