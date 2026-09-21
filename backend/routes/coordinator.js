const express = require("express");
const router = express.Router();
const { protect, coordinatorOnly } = require("../middleware/auth");
const {
  createCoordinator,
  getMyProfile,
  updateMyProfile,
  updateNotificationPreferences,
  getRecentActivity,
  uploadProfilePhoto,
  getContactInfo,
} = require("../controllers/coordinatorController");
const Coordinator = require("../models/Coordinator");
const { uploadPDF } = require("../config/cloudinary");

router.put(
  "/signature",
  protect,
  coordinatorOnly,
  uploadPDF.single("signature"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "placerise/signatures", resource_type: "image" },
          (error, result) => (error ? reject(error) : resolve(result)),
        );
        const { Readable } = require("stream");
        Readable.from(req.file.buffer).pipe(stream);
      });

      const coordinator = await Coordinator.findOneAndUpdate(
        { userId: req.user.id },
        { signatureUrl: uploadResult.secure_url },
        { new: true },
      );
      res.json({ signatureUrl: coordinator.signatureUrl });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);
const { cloudinary } = require("../config/cloudinary");
const upload = require("../middleware/upload");

router.post("/", protect, coordinatorOnly, createCoordinator);
router.get("/me", protect, coordinatorOnly, getMyProfile);
router.put("/me", protect, coordinatorOnly, updateMyProfile);
router.put(
  "/me/notifications",
  protect,
  coordinatorOnly,
  updateNotificationPreferences,
);
router.get("/me/activity", protect, coordinatorOnly, getRecentActivity);
router.get('/contact', protect, getContactInfo)
router.post("/me/profile-photo", protect, coordinatorOnly, upload.single("file"), uploadProfilePhoto);

module.exports = router;
