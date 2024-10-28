


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


// const deleteFileToTrashOnWinOnly = (filePath) => {

//     const { exec } = require('child_process');

//     const command = `powershell.exe -Command "Remove-Item -Path '${filePath}' -Recurse -Confirm:$false -ErrorAction Stop | Out-Null"`;

//     exec(command, (error) => {
//         if (error) {
//             console.error(`Error moving file to trash: ${error.message}`);
//         } else {
//             console.log(`File moved to trash: ${filePath}`);
//         }
//     });
// }
module.exports = { deleteFileToTrash, getAllFilesInDir };