




require('./configEnv');

require('./handlers');
const path = require('path');
const createTray = require('./tray');
const registerShortcuts = require('./shortcuts');
const { BrowserWindow, screen, app } = require('electron');
require('electron-reload')(path.join(__dirname, '../..'));


const isAppAlreadyRunning = app.requestSingleInstanceLock();

if (!isAppAlreadyRunning) return app.quit();



const createDesktopTollBar = () => {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = Math.round(width * 0.145);
    const windowHeight = Math.round(height * 0.075);
    const x = (width - windowWidth - 120), y = 7;

    const xw = Math.floor((screenWidth - 270) / 2);
    const yw = screenHeight - 55;
    const mainWindow = new BrowserWindow({
        x, y,
        resizable: false, skipTaskbar: true,
        width: windowWidth, height: windowHeight,
        alwaysOnTop: true, transparent: true, frame: false,
        icon: path.join(process.env.ASSETS_DIR, 'img/icons/app/appLogo.ico'),
        webPreferences: {
            sandbox: false, nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../pages/index/index.html'));
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });


    createTray(mainWindow);
    registerShortcuts(mainWindow);



    mainWindow.on('ready-to-show', () => {
        if (process.env.IS_DEV_MODE) {
            mainWindow.webContents.openDevTools({ mode: 'undocked' });
        }
    });

};


app.whenReady().then(() => {
    createDesktopTollBar();
});
