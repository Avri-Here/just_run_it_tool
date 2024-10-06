


const path = require('path');
const { ipcRenderer, clipboard } = require('electron');
const { runPsCommand } = require('../../utils/childProcess');
const { getInstalledPrograms } = require('../../utils/wmicManger');
const { runExeFileAsAdmin } = require('../../utils/childProcess');
const { openCmdAndRunFromThere } = require('../../utils/childProcess');
const { executeCommandWithSpawn } = require('../../utils/childProcess');
const { runIsolatedCommandAsAdmin, openCmdAndRunAsAdminFix } = require('../../utils/childProcess');




document.addEventListener('DOMContentLoaded', () => {


    const ffBatch = document.getElementById('ffBatch');
    const freeRam = document.getElementById('freeRam');
    const moveMouse = document.getElementById('moveMouse');
    const fixPcUtils = document.getElementById('fixPcUtils');
    const taskManager = document.getElementById('taskManager');
    const textFromImag = document.getElementById('textFromImag');
    const bcUninstaller = document.getElementById('bcUninstaller');
    const ytDlpPlaylist = document.getElementById('ytDlpPlaylist');
    const cleanSweep2Cli = document.getElementById('cleanSweep2Cli');
    const hostsFileEditor = document.getElementById('hostsFileEditor');
    const advanceUninstall = document.getElementById('advanceUninstall');
    const fullEventLogView = document.getElementById('fullEventLogView');
    const environmentEditor = document.getElementById('environmentEditor');


    setTimeout(() => { document.getElementById('gifContainer').classList.add('hidden') }, 3000);


    ffBatch.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'ffBatch', `ffBatch.exe`);
        executeCommandWithSpawn(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    freeRam.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'memReduct', `memReduct.exe`);
        executeCommandWithSpawn(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    taskManager.addEventListener('dblclick', async () => {
        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `processExplorer.exe`);
        executeCommandWithSpawn(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    ytDlpPlaylist.addEventListener('dblclick', async () => {

        const batPath = path.join(process.env.BINARIES_DIR, 'ytDlpPlaylist', 'playlist_url_to_mp3.bat');
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        openCmdAndRunFromThere(batPath);
    });


    moveMouse.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'misc', 'moveMouse.exe');
        executeCommandWithSpawn(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    bcUninstaller.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'bcUninstaller', 'BCUninstaller.exe');
        executeCommandWithSpawn(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    fullEventLogView.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'fullEventLogView', `fullEventLogView.exe`);
        executeCommandWithSpawn(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    environmentEditor.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `rapidEnvEditor.exe`);
        runExeFileAsAdmin(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    hostsFileEditor.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `hostsFileEditor.exe`);
        executeCommandWithSpawn(exePath);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });

    cleanSweep2Cli.addEventListener('dblclick', async () => {
        const params = "-1 -2 -3 -4 -5 -6 -7 -8 -9 -10 -11 -12 -13 -15 -16";
        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `cleanSweep2Cli.exe`);
        openCmdAndRunFromThere(exePath, params);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
    });


    textFromImag.addEventListener('dblclick', async () => {

        try {

            const clipboardImage = clipboard.readImage();

            if (clipboardImage.isEmpty()) {

                const notificationInfo = {
                    title: 'No image found in clipboard !',
                    icon: 'error', sound: true, timeout: 3,
                    message: 'Text from img require an image to start ..',
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
                message: 'Extracted text from image on your clipboard !',
                icon: 'success', sound: true, timeout: 3,
            }
            ipcRenderer.invoke('notificationWIthNode', notificationInfo);

        } catch (error) {

            console.error('extractingTextFromImag', error);
            const notificationInfo = {
                title: 'extractingTextFromImag',
                message: 'Error in extracting text from image !',
                icon: 'error', sound: true, timeout: 3,
            }
            ipcRenderer.invoke('notificationWIthNode', notificationInfo);
        }
    });


    advanceUninstall.addEventListener('dblclick', async () => {

        // await ipcRenderer.invoke('godModeWindows', 'progressBar');
        const allInstalledPrograms = await getInstalledPrograms();
        const result = await ipcRenderer.invoke('openDialog', {
            type: 'question',
            buttons: allInstalledPrograms,
            title: 'advanceUninstallWithWmic',
            message: 'Click a program to uninstall ..',
            cancelId: 400
        });

        if (result.response === 400) {
            console.log('User canceled advance Uninstall !');
            return;
        }

        const selectedProgram = allInstalledPrograms[result.response];
        // const commandToRun = `wmic product where "name='Nokia Connectivity Cable Driver'" call uninstall /nointeractive`
        const commandToRun = `wmic product where "name='${selectedProgram}'" call uninstall /nointeractive`;
        console.log(commandToRun);
        await openCmdAndRunAsAdminFix(commandToRun);

    });


    fixPcUtils.addEventListener('dblclick', async () => {

        const { default: Swal } = require('sweetalert2');
        const toastErrConfig = Swal.mixin({
            toast: true, timerProgressBar: true,
            showConfirmButton: false, timer: 2500,
            customClass: { popup: 'colored-toast', },
            position: 'bottom-right', iconColor: 'white',
        })

        const swalObj = {
            showDenyButton: true,
            title: '<h4><strong>ToolsToFixYourPc !</strong></h4>'
                + "select any fits your needs .." + "<br>",
            confirmButtonText: "systemFileChecker",
            denyButtonText: `cleanupImageDism`,
            footer: '<h4>builtInTools - 🛠️ - windowsOs</h4>',
            background: '#87adbd'
        }

        document.body.style.background = '#87adbd';

        const { isConfirmed, isDenied } = await Swal.fire(swalObj);
        // document.body.style.background = `url("./img/background/monterey.jpg") no-repeat center center`;

        document.body.style.backgroundImage = 'url("./img/background/monterey.jpg")';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundPosition = 'center center';


        // if systemFileChecker
        if (isConfirmed) {

            await ipcRenderer.invoke('openProgressBar', {
                timeToClose: 4500,
                title: 'Admin privileges may be required !',
                text: 'Click yes on UAC prompt if asked ..',
                detail: 'the process will start soon ..'
            });

            const success = await runIsolatedCommandAsAdmin('sfc /scannow');
            if (!success) {
                await toastErrConfig.fire({
                    icon: 'error',
                    title: 'An error occurred while running system file checker !'
                });
            };
            return;
        }

        // if cleanupImageDism
        if (isDenied) {

            await ipcRenderer.invoke('openProgressBar', {
                timeToClose: 4500,
                title: 'Admin privileges may be required !',
                text: 'Click yes on UAC prompt if asked ..',
                detail: 'the process will start soon ..'
            });

            const success = await runIsolatedCommandAsAdmin('DISM /Online /Cleanup-Image /RestoreHealth');
            if (!success) {
                await toastErrConfig.fire({
                    icon: 'error',
                    title: 'An error occurred while invoke cleanup image Dism !'
                })
            };

            return;
        }
        return;
    });


    document.querySelector('.window__close').addEventListener('click', async () => {

        await ipcRenderer.invoke('godModeWindows', 'close');
    });


    document.querySelector('.window__minimize').addEventListener('click', async () => {

        await ipcRenderer.invoke('godModeWindows', 'minimize');
    });


    document.querySelector('.window__maximize').addEventListener('click', async () => {

        await ipcRenderer.invoke('godModeWindows', 'maximize');
    });


});