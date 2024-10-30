




require('./configEnv');
require('./handlers');


const path = require('path');
const createTray = require('./tray');
const registerShortcuts = require('./shortcuts');
const { ipcMain, ipcRenderer } = require('electron');
const { BrowserWindow, screen, app } = require('electron');
require('electron-reload')(path.join(__dirname, '../..'));


const isAppAlreadyRunning = app.requestSingleInstanceLock();

if (!isAppAlreadyRunning) return app.quit();



const createDesktopTollBar = () => {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const x = Math.floor((width - 280) / 2), y = height - 58;
    
    const mainWindow = new BrowserWindow({
        width: 280, height: 86, x, y,
        resizable: false, skipTaskbar: true,
        alwaysOnTop: true, transparent: true, frame: false,
        icon: path.join(process.env.ASSETS_DIR, 'img/icons/app/appLogo.ico'),
        webPreferences: {
            sandbox: false, nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../pages/index/index.html'));

    ipcMain.handle('focusOrHideApp', async (_, requestTo) => {

        if (requestTo === 'focusAndShow') {
            mainWindow.focus();
            mainWindow.show();
        }

        else if (requestTo === 'hideApp') {
            mainWindow.hide();
        }

    });

    createTray(mainWindow);
    registerShortcuts(mainWindow, x, y);

    mainWindow.on('ready-to-show', () => {
        if (process.env.IS_DEV_MODE) {
            mainWindow.webContents.openDevTools({ mode: 'undocked' });
        }
    });


};


app.whenReady().then(() => {

    createDesktopTollBar();
    // ipcRenderer.invoke('focusOrHideApp', 'focusAndShow');
});



// mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
// mainWindow.setIgnoreMouseEvents(true, { forward: true });