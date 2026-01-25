const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Image Storage Configuration
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ayatrio/images",
    resource_type: "auto",
    quality: "auto",
  },
});

// PDF Storage Configuration
const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ayatrio/pdfs",
    resource_type: "raw",
    type: "upload",
  },
});

// AWS S3 Configuration - COMMENTED OUT (using Cloudinary instead)
/*
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const myBucket = process.env.AWS_BUCKET_NAME;

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: "ap-south-1",
});

const imageStorageS3 = multerS3({
  s3,
  bucket: myBucket,
  acl: "public-read",
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileName =
      Date.now() + "_" + file.fieldname + "_" + file.originalname;
    cb(null, fileName);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  contentDisposition: "inline",
});

const pdfStorageS3 = multerS3({
  s3,
  bucket: "ayatrio-images",
  acl: "public-read",
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileName =
      Date.now() + "_" + file.fieldname + "_" + file.originalname;
    cb(null, fileName);
  },
});
*/

function sanitizeFile(file, cb) {
  const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"];
  const pdfExts = [".pdf"]; // Allowed PDF extension

  const allowedExts = [...imageExts, ...pdfExts];

  const isAllowedExt = allowedExts.includes(
    path.extname(file.originalname.toLowerCase())
  );

  if (isAllowedExt) {
    return cb(null, true); // no error
  } else {
    cb(
      "Error: Invalid file type! Only images (.png, .jpg, .jpeg, .gif, .webp, .avif) or PDFs are allowed."
    );
  }
}

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: (req, file, callback) => {
    sanitizeFile(file, callback);
  },
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size for images
  },
});

const uploadPDF = multer({
  storage: pdfStorage,
  fileFilter: (req, file, callback) => {
    sanitizeFile(file, callback);
  },
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size for PDFs
  },
});

module.exports = { uploadImage, uploadPDF };
