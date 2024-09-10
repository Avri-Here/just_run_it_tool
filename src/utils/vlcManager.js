


const VLC_NAME = 'vlcPortable.exe';

const util = require('util');

const VLC = require('vlc-client');
const homedir = require('os').homedir()
const console = require('electron-log');
const { ipcRenderer } = require('electron');
const { exec, spawn } = require('child_process');
const { deleteFileToTrash } = require('./fileExplorer');
const fs = require('fs').promises, path = require('path');
const { runPowerShellFile, isExeRunningOnWindows } = require('./childProcess');

const vlc = new VLC.Client({ ip: 'localhost', port: 5029, username: '', password: 'pass' });



const playlistDir = path.join(homedir, 'Documents', 'appsAndMore', 'mySongs', 'playlist');

const checkVLCAndProceed = async (action) => {

    if (!(await isVlcClientRunning())) {

        const notificationInfo = {

            title: 'VLC Player not running !',
            message: 'Please start it before by dblClick on initPlay ..',
            icon: 'notification',
            sound: false,
            timeout: 5,
        }

        ipcRenderer.invoke('notificationWIthNode', notificationInfo);

    }
    return action();
};


const killAllVlcPortableInstances = async () => {

    const execAsync = util.promisify(exec);

    try {

        await execAsync(`taskkill /IM ${VLC_NAME} /F`);

        if (await isExeRunningOnWindows(VLC_NAME)) {
            throw new Error(`Error closing existing VLC instances : VLC is still running .`);
        }

        return `All existing ${VLC_NAME} instances closed successfully .`;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
};


const startAndExposeVlcPortable = async () => {

    const vlcExePath = path.join(process.env.BINARIES_DIR, 'vlc', VLC_NAME);

    const vlcParams = ['--extraintf=http',
        '--http-port=5029', '--http-password=pass',
        '--qt-start-minimized', '--qt-notification=0'];

    console.log('Starting VlcPortable after all checks and closing existing instances ..');

    const vlcProcess = spawn(vlcExePath, vlcParams,
        { detached: true, stdio: 'ignore' });

    vlcProcess.unref();

    await new Promise(resolve => setTimeout(resolve, 2500));

    const isRunning = await isExeRunningOnWindows(VLC_NAME);

    if (!isRunning) {
        console.error('Failed to start VlcPortable from startAndExposeVlcPortable ..');
        throw new Error('VLC failed to start ..');
    }

    console.log('VlcPortable started successfully !');
    return;


};



const initAndRunPlaylistFlow = async () => {

    try {

        if (await isVlcClientRunning()) {

            const result = await ipcRenderer.invoke('openDialog', {
                type: 'question',
                title: 'VLC is already running ..',
                message: `What would you like to do ? `,
                detail: 'Restart it or Keep with the current play ?',
                buttons: ['Keep', 'Restart',],
            })

            if (result.response !== 1) {
                console.log('Skip Restarting VLC ...');
                return;
            }
        }

        const randomIndex = Math.floor(Math.random() * 3) + 1;
        const notificationSound = document.getElementById('notificationSound');
        const soundSrcOnDone = `./../../assets/sound/princessPeachRescued${randomIndex}.mp3`;
        const updatePlaylistPs1Path = path.join(playlistDir, '!create_playlist.ps1');
        const isOtherVlcPortableExeOn = await isExeRunningOnWindows(VLC_NAME);
        console.log(`Init : isAnyVlcPortableExeOn ${isOtherVlcPortableExeOn}`);

        if (isOtherVlcPortableExeOn) {
            await killAllVlcPortableInstances();
        }

        await startAndExposeVlcPortable();
        await runPowerShellFile(updatePlaylistPs1Path);
        await addWplFileToPlaylist();

        notificationSound.src = soundSrcOnDone;
        notificationSound.play();
        notificationSound.playbackRate = 1.3;

        notificationSound.addEventListener('ended', async () => {
            await vlc.togglePlay()
        });



    } catch (error) {

        console.error(`An error occurred : ${error.message}`);

        const notificationInfo = {
            title: 'Error starting VLC !',
            message: 'Please check the logs for more details ..',
            icon: 'error',
            sound: true,
            timeout: 5,
        }

        ipcRenderer.invoke('notificationWIthNode', notificationInfo);
        return;

    }
};


const isVlcClientRunning = () => {

    return new Promise(async (resolve) => {

        try {

            const playing = await vlc.isPlaying();
            const paused = await vlc.isPaused();

            if (playing) {
                resolve('playing');
            }
            if (paused) {
                resolve('paused');
            }
        } catch (error) {
            resolve(false);
        }
    });
};

const deleteCurrentSongAndPlayNext = async () => {

    const playlistFolder = process.env.PLAY_LIST_NAME || 'foreign.wpl';
    const notificationSound = document.getElementById('notificationSound');

    return checkVLCAndProceed(async () => {

        try {
            const currentMedia = await vlc.getFileName();
            const playlist = await vlc.getPlaylist();
            const currentEntry = playlist.find(entry => entry.isCurrent);
            vlc.removeFromPlaylist(currentEntry.id);
            console.log(`removeFromPlaylist Song : ${currentMedia}`);
            const filePathToOut = path.join(homedir, 'Documents', 'appsAndMore', 'mySongs', playlistFolder.split('.')[0], currentMedia);
            await deleteFileToTrash(filePathToOut, false);
            console.log('deleteCurrentSongAndPlayNext Done !');
            const soundSrcOnDone = `./../../assets/sound/macEmptyTrash.mp3`;
            notificationSound.src = soundSrcOnDone;
            notificationSound.play();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await playNext();
        } catch (error) {
            console.error(`Error deleting current song and playing next : ${error}`);
            return;
        }
    });
};


const loveThisSong = async () => {

    const baseFolder = path.join(homedir, 'Documents', 'appsAndMore');
    const loveThisSongsFolder = path.join(baseFolder, 'mySongs', 'rest', 'loveThisSongs');

    return checkVLCAndProceed(async () => {

        try {

            if (!require('fs').existsSync()) {
                await fs.mkdir(loveThisSongsFolder, { recursive: true })
            };

            const playlist = await vlc.getPlaylist();
            const currentEntry = playlist.find(entry => entry.isCurrent);
            const fullPath = currentEntry.uri.replace('file:///', '');
            console.log(`fullPath Song : ${fullPath}`);
            const fileName = path.basename(fullPath);
            const newFilePath = path.join(loveThisSongsFolder, fileName);
            await fs.copyFile(fullPath, newFilePath);
            const notificationSound = document.getElementById('notificationSound');
            const soundSrcOnDone = `./../../assets/sound/successSound.mp3`;
            notificationSound.src = soundSrcOnDone;
            await vlc.pause();
            notificationSound.play();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await vlc.play();
            console.log(`Song copied to loveThisSongs folder : ${newFilePath}`);
            return;


        } catch (error) {
            console.error(`Error copied Song : ${error}`);
            return;
        }
    });
};


const addWplFileToPlaylist = async (wplFileName = 'foreign.wpl') => {

    const playlistFilePath = path.join(playlistDir, wplFileName);
    console.log('Attempting to add playlist to VLC ...');
    await vlc.addToPlaylist(playlistFilePath);
    console.log(`Playlist added : ${playlistFilePath}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // return;
};

const pauseOrResume = () => {

    return checkVLCAndProceed(async () => {

        try {

            // setTimeout(() => {
            //     console.log('Timeout of 4 seconds - reject it ..');
            //     return 'paused';
            // }, 3000);
            const isPlaying = await vlc.isPlaying();
            const isPaused = await vlc.isPaused();
            if (isPlaying) {
                await vlc.pause();
                console.log('Playback paused .');
                return 'paused';
            } if (isPaused) {
                await vlc.play();
                console.log('Playback resumed .');
                return 'play';
            }
            return;
        } catch (error) {
            console.error(`Error pausing or resuming playback : ${error}`);
        }
    });
};

const playNext = () => {
    return checkVLCAndProceed(async () => {
        try {
            await vlc.next();
            console.log('Playing next song .');
        } catch (error) {
            console.error(`Error playing next song : ${error}`);
            return;

        }
    });
};

const playPrevious = () => {
    return checkVLCAndProceed(async () => {
        try {
            await vlc.previous();
            console.log('Playing previous song .');
        } catch (error) {
            console.error(`Error playing previous song : ${error}`);
            return;
        }
    });
};


module.exports = {
    playNext, playPrevious, loveThisSong,
    initAndRunPlaylistFlow, pauseOrResume,
    deleteCurrentSongAndPlayNext, isVlcClientRunning
};




// C:\Users\avrahamy>curl -u :pass "http://localhost:5029/requests/status.xml?command=pl_stop"