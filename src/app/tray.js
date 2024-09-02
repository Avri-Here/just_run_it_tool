


const path = require('path');
const { Tray, Menu, app, BrowserWindow, screen } = require('electron');


const createTray = (mainWindow = new BrowserWindow()) => {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const tray = new Tray(path.join(__dirname, '../assets/img/icons/app/appLogo.ico'));
    const contextMenu = Menu.buildFromTemplate(
        [

            {
                label: 'GodMode',
                click: () => {

                    const allWin = BrowserWindow.getAllWindows();
                    const isGodModePageOpen = allWin.find(win => win.getTitle() === 'godModePage');
                    
                    if (isGodModePageOpen) {
                        isGodModePageOpen.openDevTools({ mode: 'undocked' });
                        return;
                    }

                    const windowWidth = Math.round(width * 0.75);
                    const windowHeight = Math.round(height * 0.8);

                    const godModeWindow = new BrowserWindow({
                        movable: true, closable: true,
                        width: windowWidth, height: windowHeight,
                        resizable: true, skipTaskbar: false,
                        alwaysOnTop: false, fullscreen: false,
                        center: true, show: true, frame: false,
                        icon: path.join(process.env.ASSETS_DIR, 'img/icons/app/godMode.ico'),
                        webPreferences: {
                            preload: path.join(__dirname, '../pages/godMode/renderer.js'),
                            nodeIntegration: true,
                            contextIsolation: false,
                            devTools: true,
                        },
                    });

                    godModeWindow.loadFile(path.join(__dirname, '../pages/godMode/index.html'));
                    godModeWindow.setResizable(true);
                    godModeWindow.setMenu(null);
                    godModeWindow.center();
                    godModeWindow.show();

                    

                },
            },

            {
                label: 'DevTools',
                click: () => {

                    if (mainWindow.webContents.isDevToolsOpened()) {
                        mainWindow.webContents.closeDevTools();
                        return;
                    }
                    mainWindow.webContents.openDevTools({ mode: 'undocked' });

                },
            },

            {
                label: 'Relaunch',
                click: () => {

                    app.relaunch(); app.exit();
                },
            },

            {

                label: 'CloseApp',
                click: () => { app.quit() },

            },
        ]);

    tray.setToolTip('justRunItToll');
    tray.setContextMenu(contextMenu);
};

module.exports = createTray;
