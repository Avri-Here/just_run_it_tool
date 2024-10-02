


const VLC_NAME = 'vlcPortable.exe';



const util = require('util');
const VLC = require('vlc-client');
const fsExtra = require('fs-extra');
const homedir = require('os').homedir()
const { ipcRenderer } = require('electron');
const { exec, spawn } = require('child_process');
const { deleteFileToTrash } = require('./fileExplorer');
const fs = require('fs').promises, path = require('path');
const { scrobbleTrackOnLastFm } = require('./lastFmUtils');
const { runPowerShellFile, isExeRunningOnWindows, timeOutPromise } = require('./childProcess');

const vlc = new VLC.Client({ ip: 'localhost', port: 5029, username: '', password: 'pass' });



const playlistDir = path.join(homedir, 'Documents', 'appsAndMore', 'mySongs', 'rest', 'playlistFiles');

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



const initAndRunPlaylistFlow = async (musicSrc = 'foreign') => {

    const notificationSound = document.getElementById('notificationSound');
    const soundsDir = path.join(process.env.ASSETS_DIR, 'sound', 'startup');
    const ps1ScriptPash = path.join(process.env.ASSETS_DIR, 'scripts', 'ps1', 'createPlaylist.ps1');

    notificationSound.playbackRate = 1.5;
    const randomIndex = Math.floor(Math.random() * 2) + 1;
    notificationSound.src = path.join(soundsDir, `princessPeachRescued${randomIndex}.mp3`);

    try {

        // const vlcClientState = await Promise.race([timeOutPromise(), getVlcClientMode()]);
        // const isVlcUnderControl = vlcClientState !== 'timeout' && vlcClientState !== 'unknown';



        const vlcClientState = await getVlcClientMode();
        const isVlcUnderControl = vlcClientState !== 'unknown';

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
        await runPowerShellFile(ps1ScriptPash, [musicSrc]);
        await addWplFileToPlaylist(musicSrc);
        await new Promise(resolve => setTimeout(resolve, 500));
        await vlc.setRandom(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        await vlc.setLooping(false);


        await notificationSound.play();
        notificationSound.addEventListener('ended', async () => {
            await vlc.togglePlay();
            if (await vlc.isPaused()) { await vlc.play() };
        });

    } catch (error) {

        console.error(`An error occurred : ${error.message}`);

        const notificationInfo = {
            title: 'Error starting VLC !',
            icon: 'error', sound: true, timeout: 7,
            message: `Info : ${error.message} ..` || 'Unknown error occurred ..',
        };

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
        return 'unknown';
    }
};

const deleteCurrentSongAndPlayNext = async () => {

    const playlist = await vlc.getPlaylist();
    const currentEntry = playlist.find(entry => entry.isCurrent);
    const fullPath = currentEntry.uri.replace('file:///', '');
    const playlistFolder = path.basename(path.dirname(fullPath));
    const notificationSound = document.getElementById('notificationSound');
    const soundSrcOnDelete = `./../../assets/sound/startup/macEmptyTrash.mp3`;


    try {

        const playlist = await vlc.getPlaylist();
        const currentMedia = await vlc.getFileName();
        const currentEntry = playlist.find(entry => entry.isCurrent);
        await vlc.removeFromPlaylist(currentEntry.id);
        console.log(`removeFromPlaylist Song : ${currentMedia}`);
        const songsFolder = path.join(homedir, 'Documents', 'appsAndMore', 'mySongs');
        const filePathToOut = path.join(songsFolder, playlistFolder, currentMedia);
        const fileName = path.basename(filePathToOut);
        const fromFolder = path.basename(path.dirname(filePathToOut));
        console.log(`fileName : ${fileName} , fromFolder : ${fromFolder}`);

        await deleteFileToTrash(filePathToOut, false);
        console.log('deleteCurrentSongAndPlayNext Done !');
        notificationSound.src = soundSrcOnDelete;
        notificationSound.play();
        await new Promise(resolve => setTimeout(resolve, 1300));
        await vlc.next();
        return;
    } catch (error) {
        console.error(`Error deleting current song and playing next : ${error}`);
        return;
    }
};


const loveThisSong = async () => {

    const currentVolume = await vlc.getVolume();
    const baseFolder = path.join(homedir, 'Documents', 'appsAndMore');
    const loveThisSongsDir = path.join(baseFolder, 'mySongs', 'foreign');


    if (!require('fs').existsSync()) {
        await fs.mkdir(loveThisSongsDir, { recursive: true });
    };

    const playlist = await vlc.getPlaylist();
    const currentEntry = playlist.find(entry => entry.isCurrent);
    const fullPath = currentEntry.uri.replace('file:///', '');


    const fileName = path.basename(fullPath);
    const fromFolder = path.basename(path.dirname(fullPath));
    const newFilePath = path.join(loveThisSongsDir, fileName);


    // Is the files name on this dir is on format of : songName)$($artistName.mp3
    const isThisDirSported = fromFolder === 'discover' || fromFolder === 'foreign';

    if (!isThisDirSported) {

        const notificationInfo = {
            title: 'loveThisSongAction',
            icon: 'info', sound: true, timeout: 6,
            message: `Song is not from Discover Or Foreign folder !`
        };

        ipcRenderer.invoke('notificationWIthNode', notificationInfo);
        return;
    }

    const notificationSound = document.getElementById('notificationSound');
    const soundSrcOnDone = `./../../assets/sound/startup/successSound.mp3`;
    const withoutExtension = fileName.replace('.mp3', '');
    const [songName, artistName] = withoutExtension.split(')$(');

    if (!songName || !artistName) {

        console.error(`Error getting songName or artistName from fileName : ${fileName}`);

        const notificationInfo = {
            title: 'scrobbleTrackError',
            icon: 'error', sound: true, timeout: 7,
            message: `Error getting songName or artistName from fileName : ${fileName}`
        };

        ipcRenderer.invoke('notificationWIthNode', notificationInfo);
        return;
    };

    console.log(`scrobbleTrackOnLastFm : songName: ${songName} , artistName: ${artistName} `);

    const anyErrorOnScrobble = await scrobbleTrackOnLastFm(artistName, songName, true);

    if (!anyErrorOnScrobble) {

        console.error(`Error with scrobbleTrackOnLastFm : ${fileName}`);

        const notificationInfo = {
            title: 'scrobbleTrackError',
            message: `scrobbleError : ${fileName}`,
            icon: 'error', sound: true, timeout: 7,
        };

        ipcRenderer.invoke('notificationWIthNode', notificationInfo);
        return;
    };

    if (fromFolder !== 'discover') {

        await vlc.setVolume(currentVolume / 2);
        notificationSound.src = soundSrcOnDone;
        notificationSound.play();
        await new Promise(resolve => setTimeout(resolve, 1300));
        await vlc.setVolume(currentVolume);
        return;
    }

    const stopOn = await vlc.getProgress();
    await new Promise(resolve => setTimeout(resolve, 500));
    await vlc.removeFromPlaylist(currentEntry.id);
    fsExtra.move(fullPath, newFilePath, { overwrite: true }, err => {
        if (err) throw err;
        console.log('Moved file to likedSongs ( foreign ) folder !');
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    await vlc.setVolume(0);
    notificationSound.src = soundSrcOnDone;
    notificationSound.play();
    await new Promise(resolve => setTimeout(resolve, 1300));
    await vlc.playFile(newFilePath);
    await new Promise(resolve => setTimeout(resolve, 500));
    await vlc.setTime(stopOn - 5);
    await new Promise(resolve => setTimeout(resolve, 500));
    await vlc.setVolume(currentVolume);
};


const addWplFileToPlaylist = async (wplFileName = 'foreign') => {

    const playlistFilePath = path.join(playlistDir, `${wplFileName}.wpl`);
    await vlc.addToPlaylist(playlistFilePath);
    console.log(`playlistFile ${wplFileName} added successfully!`);
    return;
};

const pauseOrResume = async () => {

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
        // console.error(`Error pausing or resuming playback : ${error} `);
        return;
    }
};

const playNext = () => {
    return checkVLCAndProceed(async () => {
        try {
            await vlc.next();
            console.log('Playing next song .');
        } catch (error) {
            console.error(`Error playing next song: ${error} `);
            return
        }
    });
};

const playPrevious = () => {
    return checkVLCAndProceed(async () => {
        try {
            await vlc.previous();
            console.log('Playing previous song .');
        } catch (error) {
            console.error(`Error playing previous song: ${error} `);
            return;
        }
    });
};

const pausePlaying = async () => {
    try {
        await vlc.pause();
        await new Promise(resolve => setTimeout(resolve, 400));
        console.log('vlcPause - Done !');
    } catch (error) {
        return;
    }
};

const resumePlaying = async () => {
    try {
        await vlc.play();
        await new Promise(resolve => setTimeout(resolve, 400));
        console.log('vlcPlay - Done !');
    } catch (error) {
        return;
    }
};

module.exports = {
    pausePlaying, resumePlaying,
    playNext, playPrevious, loveThisSong,
    initAndRunPlaylistFlow, pauseOrResume,
    deleteCurrentSongAndPlayNext, getVlcClientMode
};




// C:\Users\avrahamy>curl -u :pass "http://localhost:5029/requests/status.xml?command=pl_stop"