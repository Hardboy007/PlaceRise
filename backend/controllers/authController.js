const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/Student");
const Coordinator = require("../models/Coordinator");
const { sendEmail } = require("../config/email");

// Token generate karne ka function
const generateToken = (id, role, subRole) => {
  return jwt.sign({ id, role, subRole }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Helper: kisi bhi special regex character ko escape karo,
// taaki agar erpId mein galti se koi regex-special character
// (jaise ., *, +, etc.) ho toh query crash na ho
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Student Login
const studentLogin = async (req, res) => {
  try {
    const { erpId, password, subRole } = req.body;

    if (!erpId) {
      return res.status(400).json({ message: "ERP ID is required" });
    }

    const trimmedErpId = erpId.trim();

    // ERP ID se user dhundho — case-insensitive match
    // (23btcse0333, 23BTCSE0333, 23BtCsE0333 sab match honge)
    const user = await User.findOne({
      erpId: { $regex: `^${escapeRegex(trimmedErpId)}$`, $options: "i" },
      role: "student",
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid ERP ID" });
    }

    //Password check kro
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    //Student profile fetch karo
    const student = await Student.findOne({ userId: user._id });

    //Token banao aur bhejo
    res.json({
      token: generateToken(user._id, user.role),
      isFirstLogin: user.isFirstLogin,
      student: {
        id: student._id,
        name: student.name,
        erpId: user.erpId,
        branch: student.branch,
        department: student.department,
        school: student.school,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Coordinator Login
const coordinatorLogin = async (req, res) => {
  try {
    const { erpId, password, subRole } = req.body;

    if (!erpId) {
      return res.status(400).json({ message: "ERP ID is required" });
    }

    const trimmedErpId = erpId.trim();

    //Erp se user dhundho — case-insensitive match
    const user = await User.findOne({
      erpId: { $regex: `^${escapeRegex(trimmedErpId)}$`, $options: "i" },
      role: "coordinator",
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid ERP ID" });
    }

    //password check kro
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Coordinator profile fetch karo
    // Coordinator profile fetch karo — subRole match karke
    const coordinator = await Coordinator.findOne({
      userId: user._id,
      ...(subRole && { subRole }),
    });
    if (!coordinator) {
      return res
        .status(401)
        .json({ message: "Invalid role selected for this account" });
    }

    // Token banao aur bhejo

    res.json({
      token: generateToken(user._id, user.role, coordinator.subRole),
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        email: coordinator.email,
        erpId: user.erpId,
        designation: coordinator.designation,
        department: coordinator.department,
        college: coordinator.college,
        role: user.role,
        subRole: coordinator.subRole,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sirf non-first-login users ke liye current password check karo
    if (!user.isFirstLogin) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password — student/coordinator email daalega, reset link jayega
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Security: user exist na kare tab bhi same success message do,
    // taaki koi bhi yeh pata na laga sake ki kaunse emails registered hai
    if (!user) {
      return res.json({
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    // Raw token student ko email me milega, hashed version DB me save hoga —
    // isse agar DB leak bhi ho jaye, actual usable token kisi ko nahi milega
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "https://placerise.vercel.app";
    const resetLink = `${frontendUrl}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your PlaceRise Password",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #1D4ED8, #3B82F6); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <img 
              src="https://res.cloudinary.com/saviaykm/image/upload/v1783784651/WhatsApp_Image_2026-07-11_at_18.55.23_krac4c.jpg" 
              alt="PlaceRise" 
              style="height: 40px; border-radius: 8px;"
            />
            <p style="color: white; font-size: 12px; margin: 8px 0 0 0; opacity: 0.85; font-weight: 600; letter-spacing: 1px;">
              PLACERISE - Connect . Grow . Succeed
            </p>
          </div>
          <h2 style="color: #1E293B;">Reset Your Password</h2>
          <p style="color: #475569;">
            We received a request to reset your PlaceRise password. Click the button below to set a new one. This link expires in 30 minutes.
          </p>
          <a href="${resetLink}"
             style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #94A3B8; font-size: 12px;">
            If you didn't request this, you can safely ignore this email — your password won't change.
          </p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
            PlaceRise | Dev Bhoomi Uttarakhand University
          </p>
        </div>
      `,
    });

    res.json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password — token verify karke naya password set karo
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send OTP for email verification during onboarding
const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Koi aur student already is email se registered toh nahi hai?
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.id }, // apne aap ko exclude karo
    });
    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered with another account",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await User.findByIdAndUpdate(req.user.id, {
      emailOtp: hashedOtp,
      emailOtpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
      emailVerified: false,
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Verify Your Email — PlaceRise",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #1D4ED8, #3B82F6); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <img 
              src="https://res.cloudinary.com/saviaykm/image/upload/v1783784651/WhatsApp_Image_2026-07-11_at_18.55.23_krac4c.jpg" 
              alt="PlaceRise" 
              style="height: 40px; border-radius: 8px;"
            />
            <p style="color: white; font-size: 12px; margin: 8px 0 0 0; opacity: 0.85; font-weight: 600; letter-spacing: 1px;">
              PLACERISE - Connect . Grow . Succeed
            </p>
          </div>
          <h2 style="color: #1E293B;">Verify Your Email</h2>
          <p style="color: #475569;">Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
          <div style="background: #F1F5F9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1a3a8f; margin: 0;">${otp}</p>
          </div>
          <p style="color: #94A3B8; font-size: 12px;">
            If you didn't request this, ignore this email.
          </p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
            PlaceRise | Dev Bhoomi Uttarakhand University
          </p>
        </div>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return res
        .status(400)
        .json({ message: "No OTP requested. Please send OTP first." });
    }

    if (user.emailOtpExpires < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp.trim())
      .digest("hex");
    if (hashedOtp !== user.emailOtp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // OTP sahi hai — email update karo aur verified mark karo
    await User.findByIdAndUpdate(req.user.id, {
      email: email.trim().toLowerCase(),
      emailVerified: true,
      emailOtp: null,
      emailOtpExpires: null,
    });

    // Student record mein bhi email update karo
    await Student.findOneAndUpdate(
      { userId: req.user.id },
      { email: email.trim().toLowerCase() },
    );

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  studentLogin,
  coordinatorLogin,
  changePassword,
  forgotPassword,
  resetPassword,
  sendEmailOtp,
  verifyEmailOtp,
};
