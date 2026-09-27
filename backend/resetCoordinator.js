import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import dotenv from "dotenv";
dotenv.config();

const reset = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const hashedPassword = await bcrypt.hash("PlaceRise@2026", 10);
  
  await User.updateOne(
    { email: "socse.mukeshkumar@dbuu.ac.in" },
    { $set: { password: hashedPassword, isFirstLogin: true } }
  );
  
  console.log("Done!");
  mongoose.disconnect();
};

reset();