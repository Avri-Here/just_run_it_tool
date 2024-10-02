



const fs = require('fs').promises;
const { extname, dirname, join } = require('path');
const { getAllFilesInDir } = require('../utils/fileExplorer');
const { openFileDirectly } = require('../utils/childProcess');
const { startDiscoverFlow } = require('../utils/lastFmUtils');
const { getCommandBaseType } = require('../utils/childProcess');
const { clipboard, ipcRenderer, webUtils } = require('electron');
const { openCmdAndRunAsAdmin } = require('../utils/childProcess');
const { runScriptOnNewTabOrWindow } = require('../utils/childProcess');
const { pausePlaying, resumePlaying } = require('../utils/vlcManager');
const { loveThisSong, getVlcClientMode } = require('../utils/vlcManager');
const { openCmdInNewTabOrWindowFolder } = require('../utils/childProcess');
const { openCmdAsAdmin, openCmdNoAdmin } = require('../utils/childProcess');
const { getYTubeUrlByNames, downloadSongsFromYt } = require('../utils/ytDlpWrap');
const { playPrevious, deleteCurrentSongAndPlayNext, } = require('../utils/vlcManager');
const { openPowerShellAsAdmin, openPowerShellNoAdmin } = require('../utils/childProcess');
const { initAndRunPlaylistFlow, pauseOrResume, playNext } = require('../utils/vlcManager');

const scriptExtensions = ['.py', '.ps1', '.bat', '.js'];


document.addEventListener('DOMContentLoaded', async () => {


    const cmdBtn = document.querySelector('.cmdBtn');
    const nextSong = document.querySelector('.nextSong');
    const initPlay = document.querySelector('.initPlay');
    const loveSong = document.querySelector('.loveSong');
    const playIcon = document.querySelector('.icon-play');
    const btnGroup = document.querySelector('.btn-group');
    const pauseIcon = document.querySelector('.icon-pause');
    const godModeBtn = document.querySelector('.godModeBtn');
    const deleteSong = document.querySelector('.deleteSong');
    const musicPlayer = document.querySelector('.musicPlayer');
    const previousSong = document.querySelector('.previousSong');
    const powerShellBtn = document.querySelector('.powerShellBtn');
    const musicContainer = document.querySelector('.musicContainer');
    const progressContainer = document.querySelector('.progressContainer');


    btnGroup.addEventListener('dragover', async (e) => { e.preventDefault() });
    btnGroup.addEventListener('dragleave', async (e) => { e.preventDefault() });

    btnGroup.addEventListener('drop', async (e) => {

        e.preventDefault();

        const { files } = e.dataTransfer;

        if (files.length > 1) {
            const notificationInfo = {
                title: `Let's start from the beginning ..`,
                message: 'Drag only one file or folder .',
                icon: 'error',
                sound: true,
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
                message: 'Use a valid file or folder path.',
                icon: 'error',
                sound: true,
                timeout: 5,
            }

            ipcRenderer.invoke('notificationWIthNode', notificationInfo);
            return;
        }


        btnGroup.draggable = false;
        btnGroup.style.display = 'none';
        progressContainer.style.display = 'block';


        try {

            const dropFileFullPath = files[0] ? webUtils.getPathForFile(files[0]) : txtClipboard;
            await new Promise((resolve) => setTimeout(resolve, 1350));
            const stats = await fs.stat(dropFileFullPath);

            if (stats.isDirectory()) {

                openCmdInNewTabOrWindowFolder(`cd /d"${dropFileFullPath}"`);
                return;
            };


            const extFile = extname(dropFileFullPath).toLowerCase();
            const shouldOpenInTerminal = scriptExtensions.includes(extFile);

            if (shouldOpenInTerminal) {

                const asAdmin = e.ctrlKey;
                if (asAdmin) {
                    const { fullPathCommand } = getCommandBaseType(dropFileFullPath);
                    openCmdAndRunAsAdmin(fullPathCommand);
                    return;
                }

                const { filePathCommand } = getCommandBaseType(dropFileFullPath);

                clipboard.writeText(filePathCommand);
                const pathDirToOpen = dirname(dropFileFullPath);
                const commandToRun = `cd ${pathDirToOpen} && ${filePathCommand}`;
                runScriptOnNewTabOrWindow(commandToRun);
                return;
            };

            // Default case - Open file directly ..
            openFileDirectly(dropFileFullPath);

        }
        catch (err) {
            console.error(`Error :` + JSON.stringify(err, null, 2));
            return;
        }
        finally {
            btnGroup.draggable = true;
            btnGroup.style.display = 'block';
            progressContainer.style.display = 'none';
        }
    });


    musicPlayer.addEventListener('mouseover', async () => {

        const vlcClientState = await getVlcClientMode();
        const vlcUnderControl = vlcClientState !== 'unknown';

        if (!vlcUnderControl) {
            musicContainer.style.display = 'none';
            return;
        }

        if (vlcClientState === 'paused') {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
        }

        if (vlcClientState === 'playing') {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
        }

        musicContainer.style.display = 'block';
    });



    initPlay.addEventListener('dblclick', async () => {

        const musicType = await ipcRenderer.invoke('selectMusicType');
        if (!musicType) {
            console.info('No music type selected ! - returning ..');
            return;
        };


        const homedir = require('os').homedir();
        const soundElement = document.getElementById('notificationSound');
        const musicOnHoldDir = join(process.env.ASSETS_DIR, 'sound', 'musicOnHold');
        const voiceInstructions = join(process.env.ASSETS_DIR, 'sound', 'voiceInstructions');
        const discoverDir = join(homedir, 'Documents', 'appsAndMore', 'mySongs', 'discover');

        initPlay.disabled = true;

        if (musicType === 'discover') {

            // Pause and resume logic for existing playlist playing
            await pausePlaying();
            const allFilesInDir = await getAllFilesInDir(discoverDir);

            // Check if there are at least 10 files in the directory
            if (allFilesInDir.length >= 10) {
                soundElement.pause(); // Ensure previous sound is paused
                soundElement.src = join(voiceInstructions, `previousSongsWaiting.mp3`);
                soundElement.load();
                await soundElement.play();
                await new Promise((resolve) => setTimeout(resolve, 4000));
                await resumePlaying();
                await initAndRunPlaylistFlow(musicType);
                initPlay.disabled = false;
                return;
            }


            const randomIndex = Math.floor(Math.random() * 6) + 1;
            soundElement.pause();
            soundElement.src = join(musicOnHoldDir, `${randomIndex}.mp3`);
            soundElement.load();
            soundElement.loop = true;
            await soundElement.play();
            const songsNames = await startDiscoverFlow(4);
            console.log('startDiscoverFlow :', songsNames);

            if (!songsNames.length) {
                console.warn('No songs found to play! Exiting...');
                console.info('You should explore more songs...');
                soundElement.loop = false;
                soundElement.pause();
                return;
            };

            const ytUrlSongs = await getYTubeUrlByNames(songsNames);
            const currentPosition = soundElement.currentTime;
            soundElement.pause();
            soundElement.src = join(voiceInstructions, `totalSongsAre.mp3`);
            soundElement.load();
            soundElement.loop = false;
            await soundElement.play();
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const speech = new SpeechSynthesisUtterance(ytUrlSongs.length.toString());
            speech.rate = 1;
            speech.lang = 'en-US';
            await new Promise((resolve) => setTimeout(resolve, 3500));
            window.speechSynthesis.speak(speech);
            soundElement.src = join(musicOnHoldDir, `${randomIndex}.mp3`);
            soundElement.load();
            soundElement.loop = true;
            soundElement.currentTime = currentPosition;
            soundElement.play();
            const downloadSongsRes = await downloadSongsFromYt(ytUrlSongs);
            if (!downloadSongsRes) {
                soundElement.pause();
                soundElement.loop = false;
                console.info('anyToPlayFromDiscoverDir');

                const notificationInfo = {
                    title: 'discoverNewSongsError',
                    message: 'Error - No songs found to play !',
                    icon: 'error', sound: true, timeout: 6,
                }

                ipcRenderer.invoke('notificationWIthNode', notificationInfo);
                initPlay.disabled = false;
                return;
            };

            await new Promise((resolve) => setTimeout(resolve, 1000));
            soundElement.pause();
            soundElement.loop = false;
        }

        await initAndRunPlaylistFlow(musicType);
        initPlay.disabled = false;
    });

    nextSong.addEventListener('click', async () => await playNext());
    loveSong.addEventListener('click', async () => await loveThisSong());
    previousSong.addEventListener('click', async () => await playPrevious());
    deleteSong.addEventListener('click', async () => await deleteCurrentSongAndPlayNext());


    document.querySelector('.togglePlayPause').addEventListener('click', async () => {

        pauseIcon.style.display = 'none';
        playIcon.style.display = 'inline-block';

        const getState = await pauseOrResume();
        if (getState === 'paused') {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
            return;
        };

        if (getState === 'play') {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
            return;

        }

    });

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
    btnGroup.addEventListener('mouseleave', () => { musicContainer.style.display = 'none'; });
});

