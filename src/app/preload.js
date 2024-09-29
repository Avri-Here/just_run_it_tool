



const fs = require('fs').promises;
const { extname, dirname, join } = require('path');
const { openFileDirectly } = require('../utils/childProcess');
const { clipboard, ipcRenderer, webUtils } = require('electron');
const { openCmdAndRunAsAdmin } = require('../utils/childProcess');
const { discoverReallyNewMusic } = require('../utils/lastFmUtils');
const { runScriptOnNewTabOrWindow } = require('../utils/childProcess');
const { loveThisSong, getVlcClientMode } = require('../utils/vlcManager');
const { openCmdAsAdmin, openCmdNoAdmin } = require('../utils/childProcess');
const { runExeAndCloseCmd, getCommandBaseType } = require('../utils/childProcess');
const { getYTubeUrlByNames, downloadSongsFromYt } = require('../utils/ytDlpWrap');
const { playPrevious, deleteCurrentSongAndPlayNext, } = require('../utils/vlcManager');
const { openPowerShellAsAdmin, openPowerShellNoAdmin } = require('../utils/childProcess');
const { openCmdInNewTabOrWindowFolder, timeOutPromise } = require('../utils/childProcess');
const { initAndRunPlaylistFlow, pauseOrResume, playNext } = require('../utils/vlcManager');

const scriptExtensions = ['.py', '.ps1', '.bat', '.js'];


document.addEventListener('DOMContentLoaded', async () => {


    const cmdBtn = document.querySelector('.cmdBtn');
    const playIcon = document.querySelector('.icon-play');
    const initPlay = document.querySelector('.initPlay');
    const nextSong = document.querySelector('.nextSong');
    const loveSong = document.querySelector('.loveSong');
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



        try {

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

            const dropFileFullPath = files[0] ? webUtils.getPathForFile(files[0]) : txtClipboard;
            console.log(`dropFileFullPath is : ${dropFileFullPath}`);


            await new Promise((resolve) => setTimeout(resolve, 1350));
            const stats = await fs.stat(dropFileFullPath);

            if (stats.isDirectory()) {
                const openOnExplorerPlus = e.ctrlKey;
                if (openOnExplorerPlus) {
                    await runExeAndCloseCmd('explorer++.exe', dropFileFullPath);
                    return;
                }
                openCmdInNewTabOrWindowFolder(`cd /d"${dropFileFullPath}"`);
                return;
            };


            const extFile = extname(dropFileFullPath).toLowerCase();
            const shouldOpenInTerminal = scriptExtensions.includes(extFile);

            if (shouldOpenInTerminal) {

                const asAdmin = e.ctrlKey;
                const { fullPathCommand, filePathCommand } = getCommandBaseType(dropFileFullPath);

                if (asAdmin) {
                    openCmdAndRunAsAdmin(fullPathCommand);
                    return;
                }


                clipboard.writeText(filePathCommand);
                clipboard.writeText('cd ' + dirname(dropFileFullPath) + ' & ' + fullPathCommand);
                runScriptOnNewTabOrWindow(fullPathCommand);
                return;
            };

            // Default case - Open file directly ..
            openFileDirectly(dropFileFullPath);

        }
        catch (err) {
            console.error(`Error :` + err);
            return;
        }

        finally {
            await new Promise((resolve) => setTimeout(resolve, 200));
            progressContainer.style.display = 'none';
            btnGroup.style.display = 'block';
            btnGroup.draggable = true;
        }
    });


    musicPlayer.addEventListener('mouseover', async () => {


        const vlcClientState = await Promise.race([timeOutPromise(), getVlcClientMode()]);



        const vlcUnderControl = vlcClientState !== 'timeout' && vlcClientState !== 'unknown';

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

        if (!musicType) return;

        initPlay.disabled = true;

        if (musicType === 'discover') {

            const randomIndex = Math.floor(Math.random() * 6) + 1;
            const soundsDir = join(process.env.ASSETS_DIR, 'sound', 'musicOnHold');
            const soundElement = document.getElementById('notificationSound');
            soundElement.src = join(soundsDir, `${randomIndex}.mp3`);
            soundElement.play();

            const latestTopSong = await discoverReallyNewMusic(10);
            const ytUrlSongsRes = await getYTubeUrlByNames(latestTopSong);

            const notificationInfo = {
                title: 'Discovering New Songs !',
                icon: 'music', sound: false, timeout: 5000,
                message: `Total new songs found : ${ytUrlSongsRes.length}`
            };

            ipcRenderer.invoke('notificationWIthNode', notificationInfo);

            const anyToPlayFromDiscoverDir = await downloadSongsFromYt(ytUrlSongsRes);

            console.log('anyToPlayFromDiscoverDir :', anyToPlayFromDiscoverDir);

            if (!anyToPlayFromDiscoverDir) {

                soundElement.pause();

                console.error('Error with all processing of discoverNewSongsFlow ..');

                const notificationInfo = {
                    title: 'discoverNewSongsError',
                    message: 'Error with all processing of discoverNewSongsFlow ..',
                    icon: 'error', sound: true, timeout: 5,
                }

                ipcRenderer.invoke('notificationWIthNode', notificationInfo);
                initPlay.disabled = false;
                return;
            };

            await new Promise((resolve) => setTimeout(resolve, 1500));
            soundElement.pause();

        }

        await initAndRunPlaylistFlow(musicType);
        initPlay.disabled = false;
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
    btnGroup.addEventListener('mouseleave', () => { musicContainer.style.display = 'none'; });
});





// const artist = 'NF';
// const track = 'just like you';
// const latestTopSong = await getSimilarSongs(artist, track);