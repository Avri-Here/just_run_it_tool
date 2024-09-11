


const path = require('path')
const { ipcRenderer, clipboard, app } = require('electron');
const { runExeFileAsAdmin } = require('../../utils/childProcess');
const { openCmdAndRunFromThere } = require('../../utils/childProcess');
const { executeCommandWithSpawn } = require('../../utils/childProcess');
const { runIsolatedCommandAsAdmin } = require('../../utils/childProcess');
const { runPowerShellFile, runPsCommand } = require('../../utils/childProcess');




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
    const fullEventLogView = document.getElementById('fullEventLogView');
    const environmentEditor = document.getElementById('environmentEditor');



    ffBatch.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'ffBatch', `ffBatch.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
        executeCommandWithSpawn(exePath);
    });


    freeRam.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'memReduct', `memReduct.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar');
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


    environmentEditor.addEventListener('dblclick', async () => {

        const exePath = path.join(process.env.BINARIES_DIR, 'misc', `rapidEnvEditor.exe`);
        await ipcRenderer.invoke('godModeWindows', 'progressBar', 5000);
        runExeFileAsAdmin(exePath);
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


    // fixPcUtils.addEventListener('dblclick', async () => {

    //     // const exePath = path.join(process.env.BINARIES_DIR, 'fixPcUtils', 'fixPcUtils.exe');


    //     const { isConfirmed, isDenied } = await Swal.fire({
    //         showDenyButton: true,
    //         title: "Please choose a Tool to start .." + "<br>",
    //         confirmButtonText: "systemFileChecker",
    //         denyButtonText: `cleanupImageDism`,
    //     })
    //     // runIsolatedCommandAsAdmin();

    //     if (isConfirmed) {
    //         // Swal.fire("systemFileChecker !", "", "success");
    //         runIsolatedCommandAsAdmin('sfc /scannow');
    //         await ipcRenderer.invoke('openProgressBar', {
    //             title: 'fixPcUtils', detail: 'systemFileChecker will start soon ..'
    //         });
    //         return;

    //     }

    //     if (isDenied) {
    //         runIsolatedCommandAsAdmin('DISM /Online /Cleanup-Image /RestoreHealth');
    //         await ipcRenderer.invoke('openProgressBar', {
    //             title: 'fixPcUtils', detail: 'cleanupImageDism will start soon ..'
    //         });
    //     }

    // });





    fixPcUtils.addEventListener('dblclick', async () => {

        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-right',
            iconColor: 'white',
            customClass: {
                popup: 'colored-toast',
            },
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
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

        const { isConfirmed, isDenied } = await Swal.fire(swalObj);

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
                await Toast.fire({
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
                await Toast.fire({
                    icon: 'error',
                    title: 'An error occurred while invoke cleanup image Dism !'
                })
            };

            return;
        }

        return;
    });




});


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