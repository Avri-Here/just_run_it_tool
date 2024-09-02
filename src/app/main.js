



const { BrowserWindow, screen, app } = require('electron');

require('./configEnv');
require('./handlers');
const path = require('path');
const registerShortcuts = require('./shortcuts');
const createTray = require('./tray');
require('electron-reload')(path.join(__dirname, '../..'));



const createDesktopTollBar = () => {

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const windowWidth = Math.round(width * 0.15);
    const windowHeight = Math.round(height * 0.08);
    const x = (width - windowWidth - 120), y = 7;


    const mainWindow = new BrowserWindow({
        x, y,
        resizable: false, skipTaskbar: true,
        width: windowWidth, height: windowHeight,
        alwaysOnTop: true, transparent: true, frame: false,
        icon: path.join(process.env.ASSETS_DIR, 'img/icons/app/automate.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false, nodeIntegration: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../pages/index/index.html'));
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });


    registerShortcuts(mainWindow);

    mainWindow.on('ready-to-show', () => {
        if (process.env.IS_DEV_MODE) {
            mainWindow.webContents.openDevTools({ mode: 'undocked' });
        }
    });
    
    createTray(mainWindow);


}



app.whenReady().then(() => {

    createDesktopTollBar();
    if (process.platform === 'win32') { app.setAppUserModelId('com.avri.just_run_it_tool') }
});
