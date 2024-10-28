




let isProgressRunning = false;
const notifier = require('node-notifier');
const path = require('path'), log = console;
const ProgressBar = require('electron-progressbar');
const { dialog, ipcMain, Notification } = require('electron');
const { nativeImage, BrowserWindow, screen } = require('electron');



ipcMain.handle('openDialog', async (_, options) => {
    Object.assign(options, { noLink: true });
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


        const handleResult = await openCmdAndRunAsAdmin('handle64.exe', command);
        console.log(`handleResult: ${handleResult}`);
    }
});




ipcMain.handle('notificationWIthNode', (_, notificationInfo) => {

    // ffmpeg -i vlc.ico -vf scale=48:48 output.ico

    notificationInfo.icon = path.join(process.env.ASSETS_DIR, 'img/icons/notification', `${notificationInfo.icon}.ico`);

    // notificationInfo.appID = 'com.avri.just_run_it_tool';
    notificationInfo.appID = `C:\\Users\\avrahamy\\Documents\\myWorkspace\\justRunItTool\\dist\\win-unpacked\\justRunItTool.exe`;
    notifier.notify(notificationInfo);
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
                            godModeWindow.webContents.openDevTools({ mode: 'undocked' });
                        }
                    });

                }
                resolve();
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

                const stopProgressAfter = options || 2500;

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

ipcMain.handle('openProgressBar', async (_, progressBarInfo = {}) => {

    const { timeToClose } = progressBarInfo;
    const { text, title, detail } = progressBarInfo;

    const progressBar = new ProgressBar({
        text: text || 'Processing ...',
        title: title || 'please wait ...',
        detail: detail || `We're on it ! `,

    });

    progressBar.on('completed', () => {

        console.info(`completed ...`);
        // progressBar.detail = 'Exiting ...';


    }).on('aborted', () => {

        console.info(`aborted ...`);
        progressBar.detail = 'Process aborted. Exiting ...';
    });

    await new Promise(resolve => setTimeout(resolve, timeToClose || 3000));

    progressBar.setCompleted();
    progressBar.close();

    return;
});




ipcMain.handle('selectMusicType', async () => {

    const musicOptions = ["Foreign", "Discover", "Hebrew", "Classic"];

    const result = await dialog.showMessageBox({
        noLink: true, cancelId: -1, type: "question",
        buttons: musicOptions, title: "musicTypeDialog",
        message: "Hay, What music type do you want to play ?",
    });

    if (result.response === -1) return

    const selectedOption = result.response;
    return musicOptions[selectedOption].toLowerCase();
});
