


const { globalShortcut } = require('electron');

const registerShortcuts = (mainWindow) => {

    globalShortcut.register('Control+2', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

module.exports = registerShortcuts;
