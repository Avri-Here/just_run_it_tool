


const VLC_NAME = 'vlcPortable.exe';

const util = require('util');

const VLC = require('vlc-client');
const homedir = require('os').homedir()
const console = require('electron-log');
const { ipcRenderer } = require('electron');
const { exec, spawn } = require('child_process');
const { deleteFileToTrash } = require('./fileExplorer');
const fs = require('fs').promises, path = require('path');
const { runPowerShellFile, isExeRunningOnWindows, timeOutPromise } = require('./childProcess');

const vlc = new VLC.Client({ ip: 'localhost', port: 5029, username: '', password: 'pass' });



const playlistDir = path.join(homedir, 'Documents', 'appsAndMore', 'mySongs', 'playlist');

const checkVLCAndProceed = async (action) => {

    if (!(await getVlcClientMode())) {

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


const killAllVlcPortableInstancesIfAny = async () => {

    const execAsync = util.promisify(exec);
    const isKillNeeded = await isExeRunningOnWindows(VLC_NAME);

    if (!isKillNeeded) {
        return `No ${VLC_NAME} instances found to close it.`;
    };

    await execAsync(`taskkill /IM ${VLC_NAME} /F`);

    const isStillRunningAfterKill = await isExeRunningOnWindows(VLC_NAME);
    if (isStillRunningAfterKill) {
        console.error(`Error closing existing VLC instances : VLC is still running .`);
        throw new Error('killAllVlcPortableInstancesIfAny Failed !');
    }

    return `All existing ${VLC_NAME} instances closed successfully .`;

};


const startAndExposeVlcPortable = async () => {

    const vlcExePath = path.join(process.env.BINARIES_DIR, 'vlc', VLC_NAME);

    const vlcParams = ['--extraintf=http',
        '--http-port=5029', '--http-password=pass',
        '--qt-start-minimized', '--qt-notification=0'];

    console.log('After all checks and closing Any existing instances ..');
    console.log('Starting and expose VlcPortable now ..');

    const vlcProcess = spawn(vlcExePath, vlcParams,
        { detached: true, stdio: 'ignore' });

    vlcProcess.unref();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const isVlcInstanceRunning = await isExeRunningOnWindows(VLC_NAME);

    if (!isVlcInstanceRunning) {
        console.error('Failed to start VlcPortable from startAndExposeVlcPortable ..');
        throw new Error('VlcPortable failed to start ..');
    }

    console.log('VlcPortable started successfully !');
    return;
};



const initAndRunPlaylistFlow = async () => {

    const soundsDir = path.join(process.env.ASSETS_DIR, 'sound');
    const createPlaylistScriptPash = path.join(playlistDir, '!create_random_playlist.ps1');

    const randomIndex = Math.floor(Math.random() * 2) + 1;
    const notificationSound = document.getElementById('notificationSound');
    notificationSound.src = path.join(soundsDir, `princessPeachRescued${randomIndex}.mp3`);;
    notificationSound.playbackRate = 1.4;
    // const soundSrcOnDone = `./../../assets/sound/princessPeachRescued${randomIndex}.mp3`;

    try {

        const vlcClientState = await Promise.race([timeOutPromise(), getVlcClientMode()]);
        const isVlcUnderControl = vlcClientState !== 'timeout' && vlcClientState !== 'unknown';


        if (isVlcUnderControl) {

            const result = await ipcRenderer.invoke('openDialog', {
                type: 'question',
                buttons: ['Keep', 'Restart',],
                message: `What would you like to do ? `,
                title: 'VLC Client is already running ..',
                detail: 'restart it or keep with the current play ?',
            })

            if (result.response !== 1) {
                console.log('Skip Restarting VLC ...');
                return;
            }
        };


        await killAllVlcPortableInstancesIfAny();
        await startAndExposeVlcPortable();
        await runPowerShellFile(createPlaylistScriptPash);
        await addWplFileToPlaylist('foreign.wpl');

        await notificationSound.play();
        notificationSound.addEventListener('ended', async () => {
            await vlc.togglePlay();
            if (await vlc.isPaused()) { await vlc.play() };
        });

    } catch (error) {

        console.error(`An error occurred : ${error.message}`);

        const notificationInfo = {
            title: 'Error starting VLC !',
            message:
                `Error starting VLC : ${error.message} ..` || 'Unknown error occurred ..',
            icon: 'error',
            sound: true,
            timeout: 7,
        }

        ipcRenderer.invoke('notificationWIthNode', notificationInfo);
        return;
    }
};


const getVlcClientMode = async () => {


    try {

        const paused = await vlc.isPaused();
        const playing = await vlc.isPlaying();

        if (paused) return 'paused';
        if (playing) return 'playing';
        return 'unknown';
    } catch (error) {
        // console.error(`Error checking VLC status : ${error}`);
        return 'unknown';
    }
};

const deleteCurrentSongAndPlayNext = async () => {

    const playlistFolder = process.env.PLAY_LIST_NAME || 'foreign.wpl';
    const notificationSound = document.getElementById('notificationSound');

    return checkVLCAndProceed(async () => {

        try {
            const currentMedia = await vlc.getFileName();
            const playlist = await vlc.getPlaylist();
            const currentEntry = playlist.find(entry => entry.isCurrent);
            await vlc.removeFromPlaylist(currentEntry.id);
            console.log(`removeFromPlaylist Song : ${currentMedia}`);
            const filePathToOut = path.join(homedir, 'Documents', 'appsAndMore', 'mySongs', playlistFolder.split('.')[0], currentMedia);
            await deleteFileToTrash(filePathToOut, false);
            console.log('deleteCurrentSongAndPlayNext Done !');
            const soundSrcOnDone = `./../../assets/sound/macEmptyTrash.mp3`;
            notificationSound.src = soundSrcOnDone;
            notificationSound.play();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await vlc.togglePlay();
            await new Promise(resolve => setTimeout(resolve, 500));
            await vlc.play();
            return;
        } catch (error) {
            console.error(`Error deleting current song and playing next : ${error}`);
            return;
        }
    });
};


const loveThisSong = async () => {

    const currentVolume = await vlc.getVolume();
    const baseFolder = path.join(homedir, 'Documents', 'appsAndMore');
    const loveThisSongsFolder = path.join(baseFolder, 'mySongs', 'rest', 'loveThisSongs');



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
    await vlc.setVolume((currentVolume / 2));
    notificationSound.play();
    await new Promise(resolve => setTimeout(resolve, 1300));
    await vlc.setVolume(currentVolume);
    console.log(`Song copied to loveThisSongs folder : ${newFilePath}`);
    return;
};


const addWplFileToPlaylist = async (wplFileName = 'foreign.wpl') => {

    const playlistFilePath = path.join(playlistDir, wplFileName);
    await vlc.addToPlaylist(playlistFilePath);
    console.log(`PlaylistFile ${wplFileName} added successfully !`);
    // await new Promise(resolve => setTimeout(resolve, 500));
    return;
};

const pauseOrResume = async () => {

    // return checkVLCAndProceed(async () => {

    try {
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
        return;
    }
    // });
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
    deleteCurrentSongAndPlayNext, getVlcClientMode
};




// C:\Users\avrahamy>curl -u :pass "http://localhost:5029/requests/status.xml?command=pl_stop"