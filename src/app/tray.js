
const path = require('path');
const { Tray, Menu, app, BrowserWindow } = require('electron');
const createTray = (mainWindow = new BrowserWindow()) => {

    const tray = new Tray(path.join(__dirname, '../assets/img/icons/appLogo.png'));
    const contextMenu = Menu.buildFromTemplate(
        [
            // {
            //     label: 'ToggleScreen',
            //     click: () => {
            //         ipcRenderer.invoke('toggleDisplayScreen');
            //     },
            // },

            {
                label: 'GodMode',
                click: () => {

                    // Create a new BrowserWindow instance with specific webPreferences
                    mainWindow = new BrowserWindow({
                        width: 750,
                        height: 650,
                        resizable: true,
                        skipTaskbar: false,
                        alwaysOnTop: false,
                        fullscreen: false,
                        movable: true,
                        closable: true,
                        center: true,
                        show: true,
                        webPreferences: {
                            preload: path.join(__dirname, '../pages/godMode/renderer.js'),
                            // preload: null, // Explicitly set preload to null or exclude it
                            nodeIntegration: true,
                            contextIsolation: false,
                            devTools: true,
                        },
                    });

                    mainWindow.loadFile(path.join(__dirname, '../pages/godMode/index.html'));

                    // Set additional properties for the window
                    mainWindow.setResizable(true);
                    mainWindow.setMenu(null);
                    mainWindow.center();
                    mainWindow.show();

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

    tray.setToolTip('justRunIt');
    tray.setContextMenu(contextMenu);
};

module.exports = createTray;
