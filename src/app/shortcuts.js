


const { globalShortcut } = require('electron');

const registerShortcuts = (mainWindow, xAxis, yAxis,) => {

    globalShortcut.register('Control+2', () => {
        
        mainWindow.setPosition(xAxis, yAxis);
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.focus() && mainWindow.show();
    });

    globalShortcut.register('Control+3', () => {

        mainWindow.focus();
        mainWindow.show();

    });
}

module.exports = registerShortcuts;
