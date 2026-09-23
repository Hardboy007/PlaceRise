const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { scheduleWeeklyDigest } = require('./jobs/weeklyDigest')
const { scheduleDeadlineCheck } = require("./jobs/deadlineCheck");
const {
  helmetMiddleware,
  generalLimiter,
  sanitizeMiddleware,
} = require("./middleware/security");

dotenv.config();

const app = express();
app.use(helmetMiddleware);           // HTTP headers
app.use(sanitizeMiddleware);         // NoSQL injection
app.set("trust proxy", 1);          // Render ke reverse proxy ke liye zaruri hai rate limit


app.use(express.json({ limit: "10kb" }));
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
    ],
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  }),
);

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const companyRoutes = require("./routes/company");
const announcementRoutes = require("./routes/announcement");
const applicationRoutes = require("./routes/application");
const jobRoutes = require("./routes/jobs");
const coordinatorRoutes = require("./routes/coordinator");
const attendanceRoutes = require("./routes/attendance");
const notificationRoutes = require("./routes/notification");
const analyticsRoutes = require("./routes/analytics");
const nocRoutes = require("./routes/noc");

app.use("/api", generalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/coordinators", coordinatorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/noc", nocRoutes);

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.get("/health", (req, res) => {
  res.send("ok")  // ← for cron job 
});

app.use("/api/hr-feedback", require("./routes/hrFeedback"));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    scheduleWeeklyDigest();
    scheduleDeadlineCheck();
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  });
