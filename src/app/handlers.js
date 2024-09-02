





const notifier = require('node-notifier');
const path = require('path'), log = require('electron-log');
const { dialog, ipcMain, Notification, nativeImage, BrowserWindow } = require('electron');



ipcMain.handle('openDialog', async (_, options) => {
    const result = await dialog.showMessageBox(options);
    return result;
});


ipcMain.handle('showNotification', (_, { title, body, silent, timeout }) => {

    const iconsPath = path.join(process.env.ASSETS_DIR, 'img/icons/notification');
    const icon = nativeImage.createFromPath(path.join(iconsPath, 'notification.ico'));
    const notification = new Notification({ title, body, silent, icon });
    notification.show();
    setTimeout(() => { notification.close(); }, timeout || 5000);
});


ipcMain.handle('openFileDialog', async (event, identifier) => {

    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'All Files', extensions: ['*'] }],
        });

        if (!result.canceled) {
            event.sender.send('selectedFile', { path: result.filePaths[0], identifier });
        }
    } catch (error) {
        log.error('Error in openFileDialog', error);
    }
});


ipcMain.on('selectedFile', async (_, { path, identifier }) => {

    if (!path) {
        alert('Hay ' + identifier + 'No file path was selected .');
        return;
    }


    if (identifier === 'handle64') {

        const { join } = require('path');
        const exeDir = 'misc';
        const exeName = 'handle64.exe';
        const isDev = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);
        const baseDir = isDev
            ? join(__dirname, '..', '..', 'assets', 'binaries', exeDir, exeName)
            : join(process.resourcesPath, 'app.asar.unpacked', 'src', 'assets', 'binaries', exeDir, exeName);



        const fixBaseDir = `\\"\\"` + baseDir + '\\"';
        const fixParams = `\\"${path}\\"\\"`;
        const command = `${fixBaseDir} ${fixParams}`;


        const handleResult = await openCmdInNewTabOrWindowAsAdmin('handle64.exe', command);
        console.log(`handleResult: ${handleResult}`);
    }
});


ipcMain.handle('notificationWIthNode', (_, notificationInfo) => {

    notificationInfo.icon = path.join(process.env.ASSETS_DIR, 'img/icons/notification', `${notificationInfo.icon}.ico`);
    console.log('notificationInfo :', path.join(process.env.ASSETS_DIR, 'img/icons/notification', `${notificationInfo.icon}.ico`));

    // just after run the exe file, the notification icon will be shown ..
    // Get-StartApps | Where-Object { $_.Name -eq "justRunItTool" }

    // notificationInfo.appID = 'com.avri.just_run_it_tool';
    notificationInfo.appID = `C:\\Users\\avrahamy\\Documents\\myWorkspace\\justRunItTool\\dist\\win-unpacked\\justRunItTool.exe`;


    notifier.notify(notificationInfo, (err, response, metadata) => {

        if (err) { console.error(err); return; }

        console.log('User click on btnName :', response);
        // console.log('User clicked button :', metadata.activationValue);


    });

    // notifier.on('timeout', (notifierObject, options) => { });
});


ipcMain.handle('godModeWindows', (_, action, options) => {

    const godModeWindow = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'godModePage');

    switch (action) {

        case 'close':
            godModeWindow.close();
            break;

        case 'minimize':
            godModeWindow.minimize();
            break;

        case 'maximize':
            if (godModeWindow.isMaximized()) {
                godModeWindow.unmaximize();
                return;
            };
            godModeWindow.maximize();
            break;

        case 'progressBar':
            {
                const stopProgressAfter = options || 4000;

                progressInterval = setInterval(() => {

                    godModeWindow.setProgressBar(2);
                }, 50);

                setTimeout(() => {
                    clearInterval(progressInterval)
                    godModeWindow.setProgressBar(-1);
                }, stopProgressAfter)
            }
    }

});
