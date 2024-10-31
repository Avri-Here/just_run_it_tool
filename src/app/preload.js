



const fs = require('fs').promises;
const { extname, dirname, join } = require('path');
const { getAllFilesInDir } = require('../utils/fileExplorer');
const { openFileDirectly } = require('../utils/childProcess');
const { getCommandBaseType } = require('../utils/childProcess');
const { clipboard, ipcRenderer, webUtils } = require('electron');
const { openCmdAndRunAsAdmin } = require('../utils/childProcess');
const { runScriptOnNewTabOrWindow } = require('../utils/childProcess');
const { getRecommendedByTopHistory } = require('../utils/lastFmUtils');
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

    const playIcon = document.querySelector('.play');
    const toolbar = document.querySelector('.toolbar');
    const pauseIcon = document.querySelector('.pause');
    const nextSong = document.querySelector('.nextSong');
    const initPlay = document.querySelector('.initPlay');
    const loveSong = document.querySelector('.loveSong');
    const deleteSong = document.querySelector('.deleteSong');
    const dragHandle = document.querySelector('.dragHandle');
    const previousSong = document.querySelector('.previousSong');
    const musicContainer = document.querySelector('.musicContainer');


    let dragEnabled = false;

    toolbar.addEventListener('mouseenter', (e) => {
        e.preventDefault();
        if (!dragEnabled) {
            dragHandle.classList.add('enableDragEvents');
            toolbar.classList.add('enableDragEvents');
            dragEnabled = true;
            console.log('Mouse entered - Drag enabled');
        }
    });

    toolbar.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragEnabled) {
            dragHandle.classList.remove('enableDragEvents');
            toolbar.classList.remove('enableDragEvents');
            dragEnabled = false;
            console.log('Dragover event - Drag disabled');
        }
    });

    toolbar.addEventListener('drop', async (e) => {

        e.preventDefault();
        dragHandle.classList.remove('enableDragEvents');
        toolbar.classList.remove('enableDragEvents');
        dragEnabled = false;
        console.log('Dragover event - Drag disabled');


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


        // toolbar.draggable = false;
        // btnGroup.style.display = 'none';
        // progressContainer.style.display = 'block';


        try {

            const dropFileFullPath = files[0] ? webUtils.getPathForFile(files[0]) : txtClipboard;
            await new Promise((resolve) => setTimeout(resolve, 1350));
            const stats = await fs.stat(dropFileFullPath);

            if (stats.isDirectory()) {

                const asAdmin = e.ctrlKey;
                if (asAdmin) {
                    openCmdAsAdmin(dropFileFullPath);
                    return;
                }

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

                const { fileBaseCommand, filePathCommand } = getCommandBaseType(dropFileFullPath);

                clipboard.writeText(fileBaseCommand || filePathCommand);
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
            toolbar.draggable = true;
            // btnGroup.style.display = 'block';
            // progressContainer.style.display = 'none';
        }
    });


    initPlay.addEventListener('mouseover', async () => {

        const vlcClientState = await getVlcClientMode();
        const vlcUnderControl = vlcClientState !== 'unknown';

        if (!vlcUnderControl) {
            musicContainer.style.display = 'none';
            console.log('VLC is not under control !');
            return;
        };

        await ipcRenderer.invoke('focusOrHideApp', 'focusAndShow');

        if (vlcClientState === 'paused') {
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
        }

        if (vlcClientState === 'playing') {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
        }

        musicContainer.style.display = 'flex';

        console.log('VLC is under control !');
    });

    initPlay.addEventListener('dblclick', async () => {

        initPlay.disabled = true;

        const musicType = await ipcRenderer.invoke('selectMusicType');
        if (!musicType) {
            console.info('No music type selected ! - returning ..');
            initPlay.disabled = false;
            return;
        };


        const homedir = require('os').homedir();
        const soundElement = document.getElementById('notificationSound');
        const musicOnHoldDir = join(process.env.ASSETS_DIR, 'sound', 'musicOnHold');
        const voiceInstructions = join(process.env.ASSETS_DIR, 'sound', 'voiceInstructions');
        const discoverDir = join(homedir, 'Documents', 'myBackupFolder', 'songs', 'discover');


        if (musicType === 'discover') {

            await pausePlaying();
            const allFilesInDir = await getAllFilesInDir(discoverDir);

            if (allFilesInDir.length >= 10) {
                soundElement.pause();
                soundElement.src = join(voiceInstructions, `previousSongsWaiting.mp3`);
                soundElement.load();
                await soundElement.play();
                await new Promise((resolve) => setTimeout(resolve, 4000));
                await resumePlaying();
                await initAndRunPlaylistFlow(musicType);
                initPlay.disabled = false;
                return;
            };

            const randomIndex = Math.floor(Math.random() * 6) + 1;
            soundElement.pause();
            soundElement.src = join(musicOnHoldDir, `${randomIndex}.mp3`);
            soundElement.load();
            soundElement.loop = true;
            await soundElement.play();
            const songsNames = await getRecommendedByTopHistory(7);
            console.log('startDiscoverFlowRes:', songsNames);

            if (!songsNames.length) {

                console.warn('Warn || Error ! - No songs found to play ! Exiting ...');
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
            const speech = new SpeechSynthesisUtterance(ytUrlSongs.length.toString());
            speech.rate = 1;
            speech.lang = 'en-US';
            // Object.assign(speech, { rate: 1, lang: 'en-US' });
            await new Promise((resolve) => setTimeout(resolve, 4000));
            window.speechSynthesis.speak(speech);
            soundElement.src = join(musicOnHoldDir, `${randomIndex}.mp3`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            soundElement.load();
            soundElement.loop = true;
            soundElement.currentTime = currentPosition;
            await soundElement.play();
            const downloadSongsRes = await downloadSongsFromYt(ytUrlSongs);



            if (!downloadSongsRes) {
                soundElement.pause();
                soundElement.loop = false;
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

        };

    });



    // __________ cmdBtn - godModeBtn - powerShellBtn __________

    const cmdBtn = document.querySelector('.cmdBtn');
    const godModeBtn = document.querySelector('.godModeBtn');
    const powerShellBtn = document.querySelector('.powerShellBtn');


    godModeBtn.addEventListener('dblclick', async () => {
        await ipcRenderer.invoke('godModeWindows', 'open');
    });

    cmdBtn.addEventListener('dblclick', (e) => {
        const runAsAdmin = e.ctrlKey;
        runAsAdmin ? openCmdAsAdmin() : openCmdNoAdmin();
    });

    powerShellBtn.addEventListener('dblclick', (e) => {
        const runAsAdmin = e.ctrlKey;
        runAsAdmin ? openPowerShellAsAdmin() : openPowerShellNoAdmin();
    });


    cmdBtn.addEventListener('mouseover', () => { musicContainer.style.display = 'none' });
    godModeBtn.addEventListener('mouseover', () => { musicContainer.style.display = 'none' });
    powerShellBtn.addEventListener('mouseover', () => { musicContainer.style.display = 'none' });
    musicContainer.addEventListener('mouseenter', () => { musicContainer.style.display = 'flex' });


    initPlay.addEventListener('mouseleave', () => {

        setTimeout(() => {
            if (!musicContainer.matches(':hover') && !initPlay.matches(':hover')) {
                musicContainer.style.display = 'none';
            }
        }, 250);
    });

    musicContainer.addEventListener('mouseleave', () => {

        setTimeout(() => {
            if (!musicContainer.matches(':hover') && !initPlay.matches(':hover')) {
                musicContainer.style.display = 'none';
            };
        }, 250);
    });
});

