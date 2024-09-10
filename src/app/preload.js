


const fs = require('fs').promises;
const console = require('electron-log');
const { clipboard, ipcRenderer } = require('electron');
const { convertMediaFile } = require('../utils/ffmpeg');
const { openCmdInNewTabOrWindowFolder } = require('../utils/childProcess');
const { openCmdAsAdmin, openCmdNoAdmin } = require('../utils/childProcess');
const { loveThisSong, isVlcClientRunning } = require('../utils/vlcManager');
const { runExeAndCloseCmd, getCommandBaseType } = require('../utils/childProcess');
const { openFileDirectly, shouldOpenInTerminal } = require('../utils/childProcess');
const { playPrevious, deleteCurrentSongAndPlayNext, } = require('../utils/vlcManager');
const { openPowerShellAsAdmin, openPowerShellNoAdmin } = require('../utils/childProcess');
const { initAndRunPlaylistFlow, pauseOrResume, playNext } = require('../utils/vlcManager');
const { openCmdInNewTabOrWindow, openCmdInNewTabOrWindowAsAdmin } = require('../utils/childProcess');



document.addEventListener('DOMContentLoaded', async () => {


    const cmdBtn = document.querySelector('.cmdBtn');
    const playIcon = document.querySelector('.icon-play');
    const initPlay = document.querySelector('.initPlay');
    const nextSong = document.querySelector('.nextSong');
    const loveSong = document.querySelector('.loveSong');
    const btnGroup = document.querySelector('.btn-group');
    const pauseIcon = document.querySelector('.icon-pause');
    const dragFiles = document.querySelector('.list-group');
    const godModeBtn = document.querySelector('.godModeBtn');
    const deleteSong = document.querySelector('.deleteSong');
    const musicPlayer = document.querySelector('.musicPlayer');
    const previousSong = document.querySelector('.previousSong');
    const powerShellBtn = document.querySelector('.powerShellBtn');
    const musicContainer = document.querySelector('.musicContainer');
    const progressContainer = document.getElementById('progressContainer');



    dragFiles.addEventListener('drop', async (e) => {

        e.preventDefault();
        const files = e.dataTransfer.files;

        try {

            if (files.length > 1) {

                const notificationInfo = {
                    title: `Let's start from the beginning ..`,
                    message: 'Drag only one file or folder .',
                    icon: 'error',
                    sound: false,
                    timeout: 5,
                }

                ipcRenderer.invoke('notificationWIthNode', notificationInfo);
                return;
            }


            //  Vscode extensions - Copy Relative Path from a File - alexdima.com .
            const txtClipboard = clipboard.readText();
            const optionalFilePath = /^[a-zA-Z]:\\/.test(txtClipboard);

            if (!files.length && !optionalFilePath) {


                const notificationInfo = {
                    title: 'No path found on drop event or on clipboard !',
                    message: 'Use a valid file or folder .',
                    icon: 'error',
                    sound: false,
                    timeout: 5,
                }

                ipcRenderer.invoke('notificationWIthNode', notificationInfo);
                return;
            }

            const path = files[0]?.path || txtClipboard;

            dragFiles.style.display = 'none';
            btnGroup.style.display = 'none';
            progressContainer.style.display = 'block';
            await new Promise((resolve) => setTimeout(resolve, 1350));

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

            const isMadiaFile = [
                '.mp3', '.wav', '.aac', '.flac',
                '.ogg', '.wma', '.mp4', '.mkv',
                '.avi', '.mov', '.flv', '.wmv'].includes(ext);

            if (isMadiaFile) {
                convertMediaFile(path);
                return;
            };
            // Default case - open file directly ..
            openFileDirectly(path);


        }
        catch (err) {

            console.error(`Error :`, err);
            return;
        }

        finally {
            await new Promise((resolve) => setTimeout(resolve, 100));
            dragFiles.style.display = 'none';
            btnGroup.style.display = 'block';
            progressContainer.style.display = 'none';
        }
    });

    musicPlayer.addEventListener('mouseover', async () => {

        musicContainer.style.display = 'block';

        const playing = await isVlcClientRunning();

        if (!playing || playing === 'paused') {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
            return;
        }

        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline-block';

    });


    initPlay.addEventListener('dblclick', async () => {

        await initAndRunPlaylistFlow();
    });

    document.querySelector('.togglePlayPause').addEventListener('click', async () => {

        playIcon.style.display = 'inline-block';
        pauseIcon.style.display = 'none';

        try {
            const getState = await pauseOrResume();
            if (getState === 'paused') {
                playIcon.style.display = 'inline-block';
                pauseIcon.style.display = 'none';
                return;
            } if (getState === 'play') {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline-block';
                return;

            }
        } catch (error) {
            console.error('Error toggling playback :', error);
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
            return;

        }
    });




    nextSong.addEventListener('click', async () => await playNext());
    previousSong.addEventListener('click', async () => await playPrevious());
    deleteSong.addEventListener('click', async () => await deleteCurrentSongAndPlayNext());
    loveSong.addEventListener('click', async () => await loveThisSong());



    // <!-- Rest Controls  - GodModeWin , CMD , PS-->




    godModeBtn.addEventListener('dblclick', async () => {

        await ipcRenderer.invoke('godModeWindows', 'open');
    });





    cmdBtn.addEventListener('dblclick', (e) => {

        const runAsAdmin = e.ctrlKey;
        if (runAsAdmin) return openCmdAsAdmin();

        openCmdNoAdmin();
    });

    powerShellBtn.addEventListener('dblclick', (e) => {

        const runAsAdmin = e.ctrlKey;
        if (runAsAdmin) return openPowerShellAsAdmin();

        openPowerShellNoAdmin();
    });


    cmdBtn.addEventListener('mouseover', () => { musicContainer.style.display = 'none'; });
    godModeBtn.addEventListener('mouseover', () => { musicContainer.style.display = 'none'; });
    powerShellBtn.addEventListener('mouseover', () => { musicContainer.style.display = 'none'; });
    musicContainer.addEventListener('mouseleave', () => { musicContainer.style.display = 'none'; });
});



