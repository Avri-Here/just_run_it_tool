


const { globalShortcut } = require('electron');

const registerShortcuts = (mainWindow, xAxis, yAxis,) => {

    globalShortcut.register('Control+2', () => {

        if (mainWindow.isVisible()) {
            mainWindow.hide();
            return;
        }

        mainWindow.focus();
        mainWindow.show();
        mainWindow.setPosition(xAxis, yAxis);
    });

    globalShortcut.register('Control+3', () => {

        mainWindow.focus();
        mainWindow.show();

    });
}

module.exports = registerShortcuts;
