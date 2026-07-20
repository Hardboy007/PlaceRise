const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  studentLogin,
  coordinatorLogin,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.put("/change-password", protect, changePassword);
router.post("/student/login", studentLogin);
router.post("/coordinator/login", coordinatorLogin);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

module.exports = router;
