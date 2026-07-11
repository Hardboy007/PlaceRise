const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const nocRoutes = require("./routes/noc");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/noc", nocRoutes);

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const companyRoutes = require("./routes/company");
const announcementRoutes = require("./routes/announcement");
const applicationRoutes = require("./routes/application");
const jobRoutes = require("./routes/jobs");
const coordinatorRoutes = require("./routes/coordinator");
const attendanceRoutes = require("./routes/attendance");
const notificationRoutes = require('./routes/notifications')


app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/coordinators", coordinatorRoutes);
app.use('/api/notifications', notificationRoutes)

app.get("/", (req, res) => {
  res.json({ message: "PlaceRise Backend Running" });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  });

  