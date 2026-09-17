const fs = require("fs");
const path = require("path");

/**
 * Deletes a previously uploaded file from disk.
 * @param {string} foldername - subfolder under /uploads (e.g. "listings")
 * @param {string} filename - the stored filename
 */
function deleteUploadedFile(foldername, filename) {
  if (!filename) return;

  const filePath = path.join(__dirname, "..", "uploads", foldername, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.log("Error deleting file:", err.message);
    }
  });
}

module.exports = deleteUploadedFile;
