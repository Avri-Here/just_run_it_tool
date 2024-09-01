



const path = require('path');
const { app } = require('electron');
const registerShortcuts = require('./shortcuts');
require('./configEnv');
require('./handlers');
require('electron-reload')(path.join(__dirname, '../..'));



const createTray = require('./tray');
const { BrowserWindow, screen } = require('electron');


const createDesktopWidget = () => {
    console.log(process.env.BINARIES_DIR + ' process.env.BINARIES_DIR');
    
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
        if (process.env.IS_DEV_MODE) {
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
