


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

module.exports = { deleteFileToTrash };