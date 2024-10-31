


const { globalShortcut } = require('electron');


const registerShortcuts = (mainWindow, xAxis, yAxis,) => {

    globalShortcut.register('Control+2', () => {

        if (mainWindow.isVisible()) {
            mainWindow.hide();
            return;
        }
        
        mainWindow.setPosition(xAxis, yAxis);
        mainWindow.show();
        mainWindow.focus();
    });
}

module.exports = registerShortcuts;
