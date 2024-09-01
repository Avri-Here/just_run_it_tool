

const path = require('path'), os = require('os');
const { ipcRenderer, clipboard } = require('electron');
const { openCmdInNewTabOrWindowAsAdmin } = require('../../utils/childProcess');
const { runPowerShellFile, runExeAndCloseCmd, runPsCommand } = require('../../utils/childProcess');



document.addEventListener('DOMContentLoaded', () => {

    const handle64Element = document.getElementById('handle64');
    const memReductElement = document.getElementById('memReduct');
    const restartExplorerElement = document.getElementById('restartExplorer');
    const extractingTextFromImag = document.getElementById('extractingTextFromImag');

    handle64Element.addEventListener('dblclick', () => {

        ipcRenderer.invoke('openFileDialog', 'handle64');
    });


    memReductElement.addEventListener('dblclick', async () => {

        await runExeAndCloseCmd('memreduct.exe', undefined, 'memReduct');
    });


    restartExplorerElement.addEventListener('dblclick', async () => {
        const assetsPath = !process.env.IS_DEV_MODE ? process.resourcesPath : path.join(__dirname, '../', '../');

        const ps1Path = path.join(assetsPath, 'assets/scripts/ps1', 'simulateRestart.ps1');
        await runPowerShellFile(ps1Path);

    });


    ipcRenderer.on('selectedFile', async (_, { path, identifier }) => {

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

    extractingTextFromImag.addEventListener('dblclick', async () => {

        try {

            const clipboardImage = clipboard.readImage();

            if (clipboardImage.isEmpty()) {

                const notificationInfo = {
                    title: 'extractingTextFromImag ..',
                    message: 'no image found in clipboard !',
                    icon: 'error',
                    sound: true,
                    timeout: 3,
                }
                ipcRenderer.invoke('notificationWIthNode', notificationInfo);
                return;

            }



            // const shell = require('node-powershell');
            const tesseractFolder = path.join(process.env.BINARIES_DIR, 'tesseract');
            const tesseractExe = path.join(tesseractFolder, 'tesseract.exe');
            const lastClipboardImg = path.join(tesseractFolder, 'lastClipboardImg.png');

            const psCommands = [
                'Add-Type -AssemblyName System.Windows.Forms',
                `[System.Windows.Forms.Clipboard]::GetImage().Save('${lastClipboardImg}')`, // Fixed the syntax error here
                `${tesseractExe} ${lastClipboardImg} stdout -l eng`
            ];


            const result = await runPsCommand(psCommands);
            clipboard.writeText(result);

            const notificationInfo = {
                title: 'extractingTextFromImag',
                message: 'Txt is on your clipboard !',
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
});


// powershell -Command "Start-Process 'cmd.exe' -ArgumentList '/K \"\"C:\Users\avrahamy\Documents\appsAndMore\path\handle64.exe\" \"C:\Program Files\WinRAR\we.exe\"\"' -Verb RunAs"
