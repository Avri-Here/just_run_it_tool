


const { globalShortcut } = require('electron');

const registerShortcuts = (mainWindow, xAxis, yAxis,) => {

    globalShortcut.register('Control+2', () => {
        
        mainWindow.setPosition(xAxis, yAxis);
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() && mainWindow.focus();
    });

    });
}

module.exports = registerShortcuts;
