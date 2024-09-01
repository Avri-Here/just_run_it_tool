



const path = require('path');
const log = require('electron-log');
const iconsPath = path.join(__dirname, '../assets/img/icons');
const { dialog, ipcMain, Notification, nativeImage } = require('electron');

ipcMain.handle('openDialog', async (_, options) => {
    const result = await dialog.showMessageBox(options);
    return result;
});

ipcMain.handle('showNotification', (_, { title, body, silent, timeout }) => {
    const icon = nativeImage.createFromPath(path.join(iconsPath, 'notification.png'));
    const notification = new Notification({ title, body, silent, icon });
    notification.show();
    setTimeout(() => { notification.close(); }, timeout || 5000);
});


ipcMain.handle('openFileDialog', async (event, identifier) => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'All Files', extensions: ['*'] }],
        });

        if (!result.canceled) {
            event.sender.send('selectedFile', { path: result.filePaths[0], identifier });
        }
    } catch (error) {
        log.error('Error in openFileDialog', error);
    }
});