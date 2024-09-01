


const os = require('os'), path = require('path');
const { clipboard, ipcRenderer } = require('electron');
const { loveThisSong } = require('../utils/vlcManager');
const fs = require('fs').promises, console = require('electron-log');
const { convertMediaFile } = require('../utils/ffmpeg');
const { openCmdInNewTabOrWindowFolder } = require('../utils/childProcess');
const { openCmdAsAdmin, openCmdNoAdmin } = require('../utils/childProcess');
const { runExeAndCloseCmd, getCommandBaseType } = require('../utils/childProcess');
const { openFileDirectly, shouldOpenInTerminal } = require('../utils/childProcess');
const { openWindowsComponentAsAdmin, runExeAsAdmin } = require('../utils/childProcess');
const { openPowerShellAsAdmin, openPowerShellNoAdmin } = require('../utils/childProcess');
const { initAndRunPlaylistFlow, pauseOrResume, playNext } = require('../utils/vlcManager');
const { playPrevious, deleteCurrentSongAndPlayNext, isVLCRunning } = require('../utils/vlcManager');
const { openCmdInNewTabOrWindow, openCmdInNewTabOrWindowAsAdmin } = require('../utils/childProcess');



document.addEventListener('DOMContentLoaded', async () => {


    const button = document.querySelector('.togglePlayPause');
    const playIcon = button.querySelector('.icon-play');
    const pauseIcon = button.querySelector('.icon-pause');


    const btnGroup = document.querySelector('.btn-group');
    const dragFiles = document.querySelector('.list-group');

    const progressContainer = document.getElementById('progressContainer');


    dragFiles.addEventListener('drop', async (e) => {

        e.preventDefault();

        const files = e.dataTransfer.files;

        if (files.length > 1) {

            const notificationObj = {
                title: `Let's start from the beginning ..`,
                body: 'Drag only one file or folder .',
                silent: false,
                timeout: 5000
            }
            ipcRenderer.invoke('showNotification', notificationObj);
            btnGroup.style.display = 'block';
            dragFiles.style.display = 'none';
            return;
        }


        //  Vscode extensions - Copy Relative Path from a File - alexdima.com .
        const txtClipboard = clipboard.readText();
        const optionalFilePath = /^[a-zA-Z]:\\/.test(txtClipboard);

        if (!files.length && !optionalFilePath) {

            const notificationObj = {
                title: 'No file found on drop or clipboard !',
                body: 'Use a valid file or folder .',
                silent: false,
                timeout: 5000
            }
            ipcRenderer.invoke('showNotification', notificationObj);
            btnGroup.style.display = 'block';
            dragFiles.style.display = 'none';
            return;
        }

        const path = files[0]?.path || txtClipboard;
        const name = files[0]?.file || require('path').basename(txtClipboard);

        dragFiles.style.display = 'none';
        btnGroup.style.display = 'none';
        progressContainer.style.display = 'block';
        await new Promise((resolve) => setTimeout(resolve, 400));

        try {


            const dirPath = require('path').dirname(path);
            const stats = await fs.stat(path);


            if (stats.isDirectory()) {
                const openOnExplorerPlus = e.ctrlKey;
                if (openOnExplorerPlus) {
                    await runExeAndCloseCmd('explorer++.exe', path);
                    return;
                }
                openCmdInNewTabOrWindowFolder(`cd /d"${path}"`);
                return;
            };

            if (shouldOpenInTerminal(path)) {

                console.log('shouldOpenInTerminal - true');

                const asAdmin = e.ctrlKey;
                const { command, suffix } = getCommandBaseType(path);

                console.log({ command, suffix });


                if (asAdmin) {
                    openCmdInNewTabOrWindowAsAdmin(command);
                    return;
                }

                clipboard.writeText(suffix);
                openCmdInNewTabOrWindow(dirPath, suffix);
                return;
            };

            const ext = require('path').extname(path).toLowerCase();

            const isMadiaFile = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.wma', '.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv'].includes(ext)

            if (isMadiaFile) {
                convertMediaFile(path);
                return;
            };

            openFileDirectly(path);


        }
        catch (err) {

            console.error(`Error with ${name} :`, err);
        }

        finally {

            await new Promise((resolve) => setTimeout(resolve, 950));
            dragFiles.style.display = 'none';
            btnGroup.style.display = 'block';
            progressContainer.style.display = 'none';
        }


    });

    // <!-- Music Player Controls -->

    document.querySelector('.musicPlayer').addEventListener('mouseover', async () => {

        const playing = await isVLCRunning();

        if (!playing || playing === 'paused') {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
            return;
        }

        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline-block';

    });

    document.querySelector('.initPlay').addEventListener('dblclick', async () => {

        try {
            await initAndRunPlaylistFlow();
            console.log('initAndRunPlaylistFlow - Done ..');
        } catch (error) {
            console.error('Error initAndRunPlaylistFlow :', error);

        }
    });

    document.querySelector('.togglePlayPause').addEventListener('click', async () => {

        try {
            const getState = await pauseOrResume();
            if (getState === 'paused') {
                playIcon.style.display = 'inline-block';
                pauseIcon.style.display = 'none';
            } if (getState === 'play') {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline-block';
            }
        } catch (error) {
            console.error('Error toggling playback :', error);
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
        }
    });

    document.querySelector('.previousSong').addEventListener('click', async () => {

        await playPrevious();
    });

    document.querySelector('.nextSong').addEventListener('click', async () => {

        await playNext();
    });

    document.querySelector('.deleteSong').addEventListener('click', async () => {

        await deleteCurrentSongAndPlayNext();
    });


    document.querySelector('.loveSong').addEventListener('click', async () => {

        await loveThisSong();
    });



    // <!-- All the rest Controls -->


    document.querySelector('.pcExplorer').addEventListener('dblclick', async () => {

        const homeDir = os.homedir();
        const documentsDir = path.join(homeDir, 'Documents');
        const desktopDir = path.join(homeDir, 'Desktop');
        const params = `"${documentsDir}" "${desktopDir}" "${homeDir}"`;

        try {
            await runExeAndCloseCmd('explorer++.exe', params);
        } catch (error) {
            console.error('Error opening PC Explorer :', error);
        }
    });

    document.querySelector('.cleanPc').addEventListener('dblclick', async () => {

        const params = "-1 -2 -3 -4 -5 -6 -7 -8 -9 -10 -11 -12 -13 -15 -16";
        await runExeAsAdmin('cleanSweep2Cli.exe', params);
    });

    document.querySelector('.envVar').addEventListener('dblclick', async () => {

        await openWindowsComponentAsAdmin('envVariables');
    });

    document.querySelector('.openPrograms').addEventListener('dblclick', async () => {

        await openWindowsComponentAsAdmin('programsAndFeatures');
    });




    // <!-- Command Prompt and PowerShell -->
    document.querySelector('.powerShellBtn').addEventListener('dblclick', (e) => {

        const runAsAdmin = e.ctrlKey;
        if (runAsAdmin) return openPowerShellAsAdmin();

        openPowerShellNoAdmin();
    });


    document.querySelector('.cmdBtn').addEventListener('dblclick', (e) => {

        const runAsAdmin = e.ctrlKey;
        if (runAsAdmin) return openCmdAsAdmin();

        openCmdNoAdmin();
    });

});



