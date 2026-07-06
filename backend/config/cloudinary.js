const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "placerise/jd-pdfs",
    resource_type: "raw",
    allowed_formats: ["pdf"],
    public_id: (req, file) => {
      const cleanName = file.originalname
        .replace(/\.pdf$/i, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      return `${cleanName}_${Date.now()}.pdf`;
    },
  },
});

const uploadPDF = multer({ storage });

module.exports = { cloudinary, uploadPDF };
