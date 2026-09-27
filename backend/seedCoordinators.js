import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Coordinator from "./models/Coordinator.js";
import dotenv from "dotenv";
dotenv.config();

const coordinators = [
  { name: "Ms.Kamini", email: "soa.kamini@dbuu.ac.in", school: "SoA" },
  {
    name: "Dr Aditi Kuliyal (PT)",
    email: "sops.aditi@dbuu.ac.in",
    school: "DBMCPS",
  },
  {
    name: "Mosammad Sahida Begum",
    email: "son.sahida@dbuu.ac.in",
    school: "SoN",
  },
  { name: "Ashley Panwar", email: "Son.ashly@dbuu.ac.in", school: "SoN" },
  { name: "Shilpa Mamgain", email: "sopr.shilpa@dbuu.ac.in", school: "SoPR" },
  { name: "Himani Ghildiyal", email: "sopr.himani@dbuu.ac.in", school: "SoPR" },
  {
    name: "Bhaskar Chaudhary",
    email: "somc.bhaskar@dbuu.ac.in",
    school: "SoMC",
  },
  { name: "Shubhi Singh", email: "somc.shubhi@dbuu.ac.in", school: "SoMC" },
  {
    name: "Mukesh kumar",
    email: "Socse.mukeshkumar@dbuu.ac.in",
    school: "SoEC",
  },
  {
    name: "Anubhav Singh Bist",
    email: "socse.anubhav@dbuu.ac.in",
    school: "SoEC",
  },
  { name: "Rajat Hindwal", email: "ce.rajat@dbuu.ac.in", school: "SoEC" },
  {
    name: "Sayantan Bhattacharya",
    email: "me.sayantan@dbuu.ac.in",
    school: "SoEC",
  },
  {
    name: "Dr. Swati Kamal Tripathi",
    email: "ee.swati@dbuu.ac.in",
    school: "SoEC",
  },
  { name: "Shefali Bansal", email: "fd.shefali@dbuu.ac.in", school: "SoJLA" },
  {
    name: "Amit KUMAR Rathod",
    email: "sojla.amit@dbuu.ac.in",
    school: "SoJLA",
  },
  {
    name: "Amarnath Velmurugan",
    email: "soas.amarnath@dbuu.ac.in",
    school: "SoAS",
  },
  {
    name: "Shruti Mehandiratta",
    email: "sohmt.shruti@dbuu.ac.in",
    school: "SoHMT",
  },
  {
    name: "Om Prakash Gupta",
    email: "soad.omprakash@dbuu.ac.in",
    school: "SoADP",
  },
  { name: "Ankit Singh", email: "soad.ankitsingh@dbuu.ac.in", school: "SoADP" },
  { name: "Sunny Verma", email: "exam.sunny@dbuu.ac.in", school: "DBIP" },
  {
    name: "Himanshu Jhakmola",
    email: "sol.himanshu@dbuu.ac.in",
    school: "SoL",
  },
  { name: "Suruchi Negi", email: "soad.suruchi@dbuu.ac.in", school: "SoADP" },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hashedPassword = await bcrypt.hash("PlaceRise@2026", 10);

  for (const coord of coordinators) {
    const existingUser = await User.findOne({
      email: coord.email.toLowerCase(),
    });
    const existingCoord = await Coordinator.findOne({
      email: coord.email.toLowerCase(),
    });
    if (existingUser || existingCoord) {
      console.log(`Skipping (already exists): ${coord.email}`);
      continue;
    }

    const user = await User.create({
      erpId: `COORD_${Date.now()}`,
      email: coord.email.toLowerCase(),
      password: hashedPassword,
      role: "coordinator",
      isFirstLogin: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await Coordinator.create({
      userId: user._id,
      name: coord.name,
      email: coord.email.toLowerCase(),
      school: coord.school,
      subRole: "placement_coordinator",
      role: "coordinator",
      createdAt: new Date(),
    });

    console.log(`Created: ${coord.email}`);
  }

  console.log("Done!");
  mongoose.disconnect();
};

seed();
