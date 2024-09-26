


const deleteFileToTrash = async (filePath, throwErr = true) => {

    const { default: trash } = await import('trash');
    try {
        await trash([filePath]);
        console.log(`File ${filePath} moved to trash .`);
    } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error);
        if (throwErr) {
            throw err;
        }
        return;
    }
};


const getAllFilesInDir = async (dirPath) => {


    const fs = require('fs').promises;

    try {
        const files = await fs.readdir(dirPath);
        return files;
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return [];
    }

};

module.exports = { deleteFileToTrash, getAllFilesInDir };