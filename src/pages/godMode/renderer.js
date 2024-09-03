


const path = require('path'), os = require('os');
const { ipcRenderer, clipboard, shell } = require('electron');
const { executeCommandWithSpawn, openCmdAndRunFromThere } = require('../../utils/childProcess');
const { runPowerShellFile, runPsCommand } = require('../../utils/childProcess');



document.addEventListener('DOMContentLoaded', () => {

    const ffBatch = document.getElementById('ffBatch');
    const freeRam = document.getElementById('freeRam');
    const moveMouse = document.getElementById('moveMouse');
    const taskManager = document.getElementById('taskManager');
    const envVariables = document.getElementById('envVariables');
    const textFromImag = document.getElementById('textFromImag');
    const bcUninstaller = document.getElementById('bcUninstaller');
    const ytDlpPlaylist = document.getElementById('ytDlpPlaylist');
    const cleanSweep2Cli = document.getElementById('cleanSweep2Cli');
    const hostsFileEditor = document.getElementById('hostsFileEditor');
    const fullEventLogView = document.getElementById('fullEventLogView');


    ffBatch.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'ffBatch', `ffBatch.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar'); // Wait until progress bar is ready
        executeCommandWithSpawn(exePath);
    });


    freeRam.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'memReduct', `memReduct.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar'); // Wait until progress bar is ready
        executeCommandWithSpawn(exePath);
    });


    taskManager.addEventListener('dblclick', async () => {
        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `processExplorer.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        executeCommandWithSpawn(exePath);
    });


    ytDlpPlaylist.addEventListener('dblclick', async () => {

        const batPath = path.join(process.env.BINARIES_DIR, 'ytDlpPlaylist', 'playlist_url_to_mp3.bat');
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        openCmdAndRunFromThere(batPath);
    });


    moveMouse.addEventListener('dblclick', () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'misc', 'moveMouse.exe');
        ipcRenderer.invoke('godModeWindows', 'progressBar');
        runPowerShellFile(exePath);
    });


    bcUninstaller.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'bcUninstaller', 'allFiles', 'BCUninstaller.exe');
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        executeCommandWithSpawn(exePath);
    });

    fullEventLogView.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'fullEventLogView', `fullEventLogView.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        executeCommandWithSpawn(exePath);
    });


    envVariables.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `pathManager.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        executeCommandWithSpawn(exePath);
    });


    hostsFileEditor.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `hostsFileEditor.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        executeCommandWithSpawn(exePath);
    });


    cleanSweep2Cli.addEventListener('dblclick', async () => {
        const params = "-1 -2 -3 -4 -5 -6 -7 -8 -9 -10 -11 -12 -13 -15 -16";
        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `cleanSweep2Cli.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        openCmdAndRunFromThere(exePath, params);
    });



    textFromImag.addEventListener('dblclick', async () => {

        try {

            const clipboardImage = clipboard.readImage();

            if (clipboardImage.isEmpty()) {

                const notificationInfo = {
                    title: 'Text from img require an image to start ..',
                    message: 'No image found in clipboard !',
                    icon: 'error',
                    sound: true,
                    timeout: 3,
                }
                ipcRenderer.invoke('notificationWIthNode', notificationInfo);
                return;
            }



            const tesseractFolder = path.join(process.env.BINARIES_DIR, 'tesseract');
            const tesseractExe = path.join(tesseractFolder, 'tesseract.exe');
            const lastClipboardImg = path.join(tesseractFolder, 'lastClipboardImg.png');

            const psCommands = [
                'Add-Type -AssemblyName System.Windows.Forms',
                `[System.Windows.Forms.Clipboard]::GetImage().Save('${lastClipboardImg}')`,
                `${tesseractExe} ${lastClipboardImg} stdout -l eng`
            ];


            const result = await runPsCommand(psCommands);
            clipboard.writeText(result);

            const notificationInfo = {
                title: 'Success ! ',
                message: 'Extracted text from image is copied to clipboard !',
                icon: 'success',
                sound: true,
                timeout: 3,
            }
            ipcRenderer.invoke('notificationWIthNode', notificationInfo);

        } catch (error) {

            console.error('extractingTextFromImag', error);
            const notificationInfo = {
                title: 'extractingTextFromImag',
                message: 'Error in extracting text from image !',
                icon: 'error',
                sound: true,
                timeout: 3,
            }
            ipcRenderer.invoke('notificationWIthNode', notificationInfo);
        }
    });



    // Action buttons on title bar ..

    document.querySelector('.window__close').addEventListener('click', async () => {

        await ipcRenderer.invoke('godModeWindows', 'close');

    })

    document.querySelector('.window__minimize').addEventListener('click', async () => {

        await ipcRenderer.invoke('godModeWindows', 'minimize');

    })

    document.querySelector('.window__maximize').addEventListener('click', async () => {

        await ipcRenderer.invoke('godModeWindows', 'maximize');

    })

    // const handle64 = document.getElementById('handle64');

    // handle64Element.addEventListener('dblclick', () => {

    //     ipcRenderer.invoke('openFileDialog', 'handle64'); // Pass an identifier
    // });

    // memReductElement.addEventListener('dblclick', async () => {

    //     await runExeAndCloseCmd('memreduct.exe', undefined, 'memReduct');
    // });


    // ipcRenderer.on('selectedFile', async (_, { path, identifier }) => {

    //     if (!path) {
    //         alert('Hay ' + identifier + 'No file path was selected .');
    //         return;
    //     }

    //     alert(`Processing file from identifier : ${identifier} : ${path}`);

    //     if (identifier === 'handle64') {
    //         const { join } = require('path');
    //         const exeDir = 'misc';
    //         const exeName = 'handle64.exe';
    //         const params = ` "${path}" `;
    //         const isDev = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);
    //         const baseDir = isDev
    //             ? join(__dirname, '..', '..', 'assets', 'binaries', exeDir, exeName)
    //             : join(process.resourcesPath, 'app.asar.unpacked', 'src', 'assets', 'binaries', exeDir, exeName);


    //         const command = ` "${baseDir}" ` + params;

    //         await openCmdInNewTabOrWindowAsAdmin(command);
    //     }
    // });


    // ExtractingTextFromImag ..

});
