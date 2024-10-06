


const path = require('path')
const { ipcRenderer, clipboard } = require('electron');
const { runPsCommand } = require('../../utils/childProcess');
const { runExeFileAsAdmin } = require('../../utils/childProcess');
const { openCmdAndRunFromThere } = require('../../utils/childProcess');
const { executeCommandWithSpawn } = require('../../utils/childProcess');
const { runIsolatedCommandAsAdmin } = require('../../utils/childProcess');




document.addEventListener('DOMContentLoaded', () => {

    const { default: Swal } = require('sweetalert2');

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
        // const { value: formValues } = await Swal.fire({
        //     title: "advanceUninstall",
        //     html: `
        //     <form id="optionsForm">
        //       <label><input type="checkbox" id="option1"> Option 1</label><br>
        //       <div class="options-row">
        //         <label><input type="checkbox" id="option2"> Option 2</label>
        //         <label><input type="checkbox" id="option3"> Option 3</label>
        //       </div>
        //     </form>
        //   `,
        //     focusConfirm: false,
        //     showCancelButton: true,
        //     preConfirm: () => {
        //         const option1 = document.getElementById('option1').checked;
        //         const option2 = document.getElementById('option2').checked;
        //         const option3 = document.getElementById('option3').checked;
        //         return {
        //             option1,
        //             option2,
        //             option3,
        //         };
            // },
        // });

        // if (formValues) {
        //     Swal.fire(`
        //       Option 1: ${formValues.option1}
        //       Option 2: ${formValues.option2}
        //       Option 3: ${formValues.option3}
        //     `);


    });
    fixPcUtils.addEventListener('dblclick', async () => {

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
            background: '#87adbd',

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
                })
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



    // Action buttons on title bar ..

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