const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect, coordinatorOnly } = require("../middleware/auth");
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  savePdfUrl,
} = require("../controllers/nocController");

router.post("/", protect, upload.single("proof"), createRequest);
router.get("/my", protect, getMyRequests);
router.get("/", protect, coordinatorOnly, getAllRequests);
router.put("/:id/status", protect, coordinatorOnly, updateRequestStatus);
router.put("/:id/pdf", protect, coordinatorOnly, savePdfUrl);

module.exports = router;