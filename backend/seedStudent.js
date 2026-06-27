const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");
const Student = require("./models/Student");
const Coordinator = require("./models/Coordinator");

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Purana data delete karo
  await User.deleteMany({});
  await Student.deleteMany({});
  await Coordinator.deleteMany({});

  // Coordinator banao
  const hashedCoordPassword = await bcrypt.hash("test123", 10);
  const coordUser = await User.create({
    erpId: "COORD001",
    email: "coordinator@dbuu.ac.in",
    password: hashedCoordPassword,
    role: "coordinator",
    isFirstLogin: false,
  });
  await Coordinator.create({
    userId: coordUser._id,
    name: "Mr. Mukesh Kumar",
    email: "coordinator@dbuu.ac.in",
    designation: "Placement Coordinator",
    department: "Training & Placement Cell",
    college: "Dev Bhoomi Uttarakhand University",
  });

  // Student banao — DOB se password
  const dob = new Date("2002-05-15");
  const day = String(dob.getDate()).padStart(2, "0");
  const month = String(dob.getMonth() + 1).padStart(2, "0");
  const year = dob.getFullYear();
  const defaultPassword = `${day}${month}${year}`; // 15052002

  const hashedStudentPassword = await bcrypt.hash(defaultPassword, 10);
  const studentUser = await User.create({
    erpId: "23BTCSE5645",
    email: "aarav.sharma@dbuu.ac.in",
    password: hashedStudentPassword,
    role: "student",
    isFirstLogin: true,
  });
  await Student.create({
    userId: studentUser._id,
    name: "Aarav Sharma",
    email: "aarav.sharma@dbuu.ac.in",
    phone: "+91 98765 43210",
    dob: "2002-05-15",
    gender: "Male",
    city: "Dehradun",
    state: "Uttarakhand",
    school: "School of Engineering & Computing (SoEC)",
    course: "B.Tech - Computer Science & Engineering",
    branch: "Computer Science Engineering",
    batch: "2026",
    cgpa: 8.4,
    tenthMarks: 88,
    twelfthMarks: 82,
    backlogs: 0,
    skills: ["React", "Node.js", "Python", "MongoDB"],
    placementStatus: "Not Placed",
  });

  console.log("Seed complete!");
  console.log("Coordinator — ERP: COORD001, Password: test123");
  console.log("Student — ERP: 23BTCSE5645, Password: 15052002");

  process.exit();
};

seed();
