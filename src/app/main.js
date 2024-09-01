



// // let mainWindow, rightClickCount = 0;
// // const { runPowerShellFile } = require('../utils/childProcess');
// // const { desktopCapturer, session } = require('electron')
// // const { getValue, setValue } = require('../utils/electronStore');
// // const HMC = require('hmc-win32');


// // const { GlobalKeyboardListener } = require('node-global-key-listener');
// // const keyListener = new GlobalKeyboardListener();


// let mainWindow = null;
// const createTray = require('./tray');
// const { BrowserWindow, dialog } = require('electron');
// const path = require('path'), log = require('electron-log');
// const iconsPath = path.join(__dirname, '../assets/img/icons');
// const { app, screen, ipcMain, globalShortcut } = require('electron');


// require('electron-reload')(path.join(__dirname, '../..'));

// const createDesktopWidget = () => {


//     const primaryDisplay = screen.getPrimaryDisplay();
//     const { width, height } = primaryDisplay.workAreaSize;

//     // Right top of the screen !
//     const windowWidth = Math.round(width * 0.15); // Set this if you wont app with more btns ..
//     const windowHeight = Math.round(height * 0.08);
//     const x = width - windowWidth - 120; // Set this to control how it margin from the Right ..
//     const y = 7; // Set this to control how it margin from the Top ..


//     mainWindow = new BrowserWindow({
//         x: x, y: y,
//         width: windowWidth, height: windowHeight,
//         resizable: false, skipTaskbar: true,
//         alwaysOnTop: true, transparent: true, frame: false,
//         webPreferences: {
//             preload: path.join(__dirname, 'preload.js'),
//             sandbox: false, nodeIntegration: true,
//             devTools: true,
//         },

//     });

//     mainWindow.loadFile(path.join(__dirname, '../pages/index/index.html'));
//     mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
//     createTray(mainWindow);


//     mainWindow.on("ready-to-show", () => {
//         const isDev = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);
//         if (isDev) {
//             mainWindow.webContents.openDevTools({ mode: 'undocked' });
//         }

//     });


//     globalShortcut.register('Control+2', () => {
//         log.info('Control+2 is pressed ..');
//         mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
//     });
// }


// ipcMain.handle('openDialog', async (_, options) => {

//     const result = await dialog.showMessageBox(options);
//     return result;
// });


// ipcMain.handle('showNotification', (_, { title, body, silent, timeout }) => {

//     const { Notification, nativeImage } = require("electron");
//     const icon = nativeImage.createFromPath(path.join(iconsPath, 'notification.png'));
//     const notification = new Notification({ title, body, silent, icon });
//     notification.show();
//     setTimeout(() => { notification.close() }, timeout || 5000);
// });

// ipcMain.handle('openFileDialog', async (event) => {

//     try {
//         const result = await dialog.showOpenDialog({
//             properties: ['openFile'],
//             filters: [{ name: 'All Files', extensions: ['*'] }],
//         })

//         if (!result.canceled) {
//             event.sender.send('selectedFile', result.filePaths[0]);
//         }
//     } catch (error) {
//         log.error('Error in openFileDialog', error);
//         return;
//     }

// })




// app.whenReady().then(() => {
//     createDesktopWidget();
//     if (process.platform == 'win32') {
//         app.setAppUserModelId('justRunItTool');
//     }
// });



const path = require('path');
const { app } = require('electron');
const registerShortcuts = require('./shortcuts');
require('./handlers');
require('electron-reload')(path.join(__dirname, '../..'));



const createTray = require('./tray');
const { BrowserWindow, screen } = require('electron');


const createDesktopWidget = () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const windowWidth = Math.round(width * 0.15);
    const windowHeight = Math.round(height * 0.08);
    const x = width - windowWidth - 120;
    const y = 7;

    const mainWindow = new BrowserWindow({
        x, y,
        width: windowWidth, height: windowHeight,
        resizable: false, skipTaskbar: true,
        alwaysOnTop: true, transparent: true, frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false, nodeIntegration: true,
            devTools: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../pages/index/index.html'));
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    createTray(mainWindow);

    mainWindow.on('ready-to-show', () => {
        const isDev = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);
        if (isDev) {
            mainWindow.webContents.openDevTools({ mode: 'undocked' });
        }
    });

    return mainWindow;
}



app.whenReady().then(() => {

    const mainWindow = createDesktopWidget();
    registerShortcuts(mainWindow);
    if (process.platform === 'win32') { app.setAppUserModelId('justRunItTool') }
});
