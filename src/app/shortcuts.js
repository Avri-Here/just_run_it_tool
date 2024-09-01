


const log = require('electron-log');
const { globalShortcut } = require('electron');

const registerShortcuts = (mainWindow) => {

    globalShortcut.register('Control+2', () => {
        log.info('Control+2 is pressed ..');
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

module.exports = registerShortcuts;
