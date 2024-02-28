const fs = require('fs').promises;

module.exports = async function deleteImage(image) {
    try {
        await fs.access(image, fs.constants.F_OK); // Check if the file exists
        await fs.unlink(image); // Delete the file
        console.log('File deleted successfully');
        return true;
    } catch (err) {
        console.error('Error deleting file:', err);
        return false;
    }
}