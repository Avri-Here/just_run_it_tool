


const path = require('path');
const { Tray, Menu, app, BrowserWindow, screen } = require('electron');


const createTray = (mainWindow = new BrowserWindow()) => {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const tray = new Tray(path.join(process.env.ASSETS_DIR, 'img/icons/app/appLogo.ico'));
    const contextMenu = Menu.buildFromTemplate(
        [
            {
                label: 'DevTools',
                click: () => {

                    if (mainWindow.webContents.isDevToolsOpened()) {
                        mainWindow.webContents.closeDevTools();
                        return;
                    }
                    mainWindow.webContents.openDevTools({ mode: 'undocked' });
                    mainWindow.webContents.setDevToolsTitle('desktopTollBar');

                },
            },

            {
                label: 'Relaunch',
                click: () => {

                    app.relaunch();
                    app.exit();
                },
            },

            {

                label: 'CloseApp',
                click: () => {

                    app.quit()
                },

            },
        ]);

    // tray.setToolTip('justRunItToll');
    tray.setContextMenu(contextMenu);
};

module.exports = createTray;
