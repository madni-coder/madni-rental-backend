const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

const upload = multer({
    fileFilter(req, file, cb) {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed."));
        }

        return cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    storage: multer.memoryStorage(),
});

/**
 * Upload a buffer to Cloudinary as a raw PDF file.
 * Returns the Cloudinary upload result (includes secure_url).
 */
function uploadToCloudinary(buffer, publicId) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "rent-agreements",
                public_id: publicId,
                resource_type: "raw",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                return resolve(result);
            },
        );

        stream.end(buffer);
    });
}

module.exports = { upload, uploadToCloudinary };
