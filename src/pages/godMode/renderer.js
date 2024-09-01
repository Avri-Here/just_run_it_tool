

const path = require('path');
const { ipcRenderer } = require('electron');
const { openCmdInNewTabOrWindowAsAdmin } = require('../../utils/childProcess');
const { runPowerShellFile, runExeAndCloseCmd } = require('../../utils/childProcess');

document.addEventListener('DOMContentLoaded', () => {

    const handle64Element = document.getElementById('handle64');
    const memReductElement = document.getElementById('memReduct');
    const restartExplorerElement = document.getElementById('restartExplorer');

    handle64Element.addEventListener('dblclick', () => {

        ipcRenderer.invoke('openFileDialog', 'handle64');
    });


    memReductElement.addEventListener('dblclick', async () => {

        await runExeAndCloseCmd('memreduct.exe', undefined, 'memReduct');
    });


    restartExplorerElement.addEventListener('dblclick', async () => {

        // const updatePlaylistPs1Path = path.join(require('os').homedir(), 'Documents', 'appsAndMore', 'mySongs', 'playlist', '!create_playlist.ps1');
        const isDev = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath);
        const baseDir = isDev ? path.join(__dirname, '..', '..', 'assets', 'scripts', 'ps1')
            : path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'assets', 'scripts', 'ps1');

        const ps1Path = path.join(baseDir, 'simulateRestart.ps1');
        await runPowerShellFile(ps1Path);

    });


    ipcRenderer.on('selectedFile', async (_, { path, identifier }) => {

        if (!path) {
            alert('Hay ' + identifier + 'No file path was selected .');
            return;
        }

        // alert(`Processing file from identifier : ${identifier} : ${path}`);

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
});


// powershell -Command "Start-Process 'cmd.exe' -ArgumentList '/K \"\"C:\Users\avrahamy\Documents\appsAndMore\path\handle64.exe\" \"C:\Program Files\WinRAR\we.exe\"\"' -Verb RunAs"
