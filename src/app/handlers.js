




let isProgressRunning = false;
const notifier = require('node-notifier');
const path = require('path'), log = require('electron-log');
const { dialog, ipcMain, Notification, nativeImage, BrowserWindow, screen } = require('electron');



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


// open notifications with input to paste url to download from youtube ..
ipcMain.handle('notificationWithInput', async (_,) => {

    const notificationInfo = {
        title: `Let's start from the beginning ..`,
        message: 'Drag only one file or folder .',
        icon: 'error',
        sound: false,
        wait: true, // Wait for user action
        timeout: 5,
        // actions: ['Ok', 'Start'],
        input: true,
    }

    const res = await notifier.notify(notificationInfo);



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



ipcMain.handle('godModeWindows', async (_, action, options) => {

    return new Promise(async (resolve) => {

        const godModeWindow = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'godModePage');

        switch (action) {

            case 'open':
                {
                    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
                    const isGodModePageOpen = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'godModePage');

                    if (isGodModePageOpen && !isGodModePageOpen.isDestroyed()) {
                        isGodModePageOpen.openDevTools({ mode: 'undocked' });
                        return;
                    };

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
                        },
                    });

                 
                    godModeWindow.loadFile(path.join(__dirname, '../pages/godMode/index.html'));
                    godModeWindow.setMenu(null);
                    godModeWindow.center();
                    godModeWindow.show();

                    godModeWindow.on('ready-to-show', () => {

                        if (process.env.IS_DEV_MODE) {
                            // godModeWindow.webContents.openDevTools({ mode: 'undocked' });
                        }
                    });

                }
                break;



            case 'close':

                godModeWindow.close();
                resolve();
                break;

            case 'minimize':

                godModeWindow.minimize();
                resolve();
                break;

            case 'maximize':

                if (godModeWindow.isMaximized()) {
                    godModeWindow.unmaximize();
                    resolve();
                    return;
                }
                godModeWindow.maximize();
                resolve();
                break;

            case 'progressBar':

                const stopProgressAfter = options || 3000;
                // console.log('isProgressRunning :', isProgressRunning);

                while (isProgressRunning) await new Promise(resolve => setTimeout(resolve, 200));


                isProgressRunning = true;
                godModeWindow.setProgressBar(2);
                await new Promise(resolve => setTimeout(resolve, stopProgressAfter));
                isProgressRunning = false;
                godModeWindow.setProgressBar(-1);

                resolve();
                break;
        }
    });
});

