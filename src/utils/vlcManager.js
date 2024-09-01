



const path = require('path');
const VLC = require('vlc-client');
const console = require('electron-log');
const { ipcRenderer } = require('electron');
const { exec } = require('child_process');
const { deleteFileToTrash } = require('./fileExplorer');
const { runPowerShellFile } = require('./childProcess');
const vlc = new VLC.Client({ ip: 'localhost', port: 5029, username: '', password: 'pass' });


const checkVLCAndProceed = async (action) => {

    if (!(await isVLCRunning())) {
        ipcRenderer.invoke('showNotification',
            {
                title: 'VLC Player not running !',
                body: 'Please start it before by dblClick on initPlay ..',
                silent: true,
                timeout: 7000
            }
        );
        return;

    }
    return action();
};

const killVLCInstances = () => {

    return new Promise((resolve, reject) => {
        exec('taskkill /IM vlc.exe /F', (err, _, stderr) => {
            if (stderr) {
                console.error(`Error details : ${stderr}`);
            }
            if (err) {
                if (stderr.includes('The process "vlc.exe" not found')) {
                    console.log('No existing VLC instances found to close .');
                    resolve();
                } else {
                    console.info(`Error closing existing VLC instances : ${err}`);
                    reject(new Error('Error closing existing VLC instances'));
                }
            } else {
                console.log('All existing VLC instances closed successfully .');
                resolve();
            }
        });
    });
};


const startVLC = async () => {

    const { spawn } = require('child_process'), path = require('path');

    console.log('Starting VLC ...');
    
    const vlcExePath = path.join(process.env.BINARIES_DIR, 'vlc', 'vlc.exe');

    const vlcParams = ['--extraintf=http', '--http-port=5029', '--http-password=pass', '--qt-start-minimized', '--qt-notification=0'];

    const vlcProcess = spawn(vlcExePath, vlcParams, {
        detached: true,
        stdio: 'ignore'
    });

    vlcProcess.unref();
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
};



const initAndRunPlaylistFlow = async () => {

    if (await isVLCRunning()) {

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

    const updatePlaylistPs1Path = path.join(require('os').homedir(), 'Documents', 'appsAndMore', 'mySongs', 'playlist', '!create_playlist.ps1');
    try {
        await killVLCInstances();
        await runPowerShellFile(updatePlaylistPs1Path);
        await startVLC();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await playSongsRandomly();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('initAndRunPlaylistFlow Done !');
    } catch (error) {
        console.error(`An error occurred : ${error.message}`);
        // try {
        // await startVLC();
        // await new Promise(resolve => setTimeout(resolve, 1000));
        // const output = await youtubedl('https://www.youtube.com/watch?v=p6OCPq_fnyc');

        // const videoLink = output.url;
        // console.log({videoLink});

        // await vlc.addToPlaylist(videoLink);
        // await vlc.setRandom(true);
        // await vlc.togglePlay();
        // } catch (error) {
        throw error;
        // }
    }
};


const isVLCRunning = () => {

    return new Promise(async (resolve) => {
        try {
            const playing = await vlc.isPlaying();
            const paused = await vlc.isPaused();

            if (playing) {
                // console.log(`isVLCRunning : ${true} and playing ..`);
                resolve('playing');
            }
            if (paused) {
                // console.log(`isVLCRunning : ${true} and paused ..`);
                resolve('paused');
            }
        } catch (error) {
            // console.warn(`Warn isVLCRunning : ${false}`);
            resolve(false);
        }
    });
};

const deleteCurrentSongAndPlayNext = async () => {
    return checkVLCAndProceed(async () => {
        const playlistFolder = process.env.PLAY_LIST_NAME || 'foreign.wpl';
        try {
            const currentMedia = await vlc.getFileName();
            const playlist = await vlc.getPlaylist();
            const currentEntry = playlist.find(entry => entry.isCurrent);
            vlc.removeFromPlaylist(currentEntry.id);
            await playNext();
            // await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`removeFromPlaylist Song : ${currentMedia}`);
            const filePathToOut = path.join(require('os').homedir(), 'Documents', 'appsAndMore', 'mySongs', playlistFolder.split('.')[0], currentMedia);
            // await new Promise(resolve => setTimeout(resolve, 2000));
            await deleteFileToTrash(filePathToOut, false);
            console.log(`Song deleted from path : ${path.basename(filePathToOut)} !`);
            console.log('deleteCurrentSongAndPlayNext Done !');
        } catch (error) {
            console.error(`Error deleting current song and playing next : ${error}`);
            return;
        }
    });
};


const loveThisSong = async () => {

    const fs = require('fs').promises, path = require('path');

    const loveThisSongsFolder = path.join(require('os').homedir(), 'Documents', 'appsAndMore', 'mySongs', 'rest', 'loveThisSongs');


    return checkVLCAndProceed(async () => {

        try {

            if (!require('fs').existsSync()) await fs.mkdir(loveThisSongsFolder, { recursive: true });

            const playlist = await vlc.getPlaylist();
            const currentEntry = playlist.find(entry => entry.isCurrent);

            // console.log(`currentMedia Song : ${currentMedia}`);
            // console.log(`currentEntry Song : ${JSON.stringify(currentEntry)}`);

            const fullPath = currentEntry.uri.replace('file:///', '');
            console.log(`fullPath Song : ${fullPath}`);

            // copy the file to the loveThisSongs folder  ..

            const fileName = path.basename(fullPath);
            const newFilePath = path.join(loveThisSongsFolder, fileName);
            await fs.copyFile(fullPath, newFilePath);

            console.log(`Song copied to loveThisSongs folder : ${newFilePath}`);


        } catch (error) {
            console.error(`Error copied Song : ${error}`);
            return;
        }
    });
};


const loveThisSong2 = async () => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(require('os').homedir(), 'Documents', 'appsAndMore', 'mySongs', 'rest', 'playlist');
    const wplFilePath = path.join(filePath, 'loveThisSongs.wpl');
    return checkVLCAndProceed(async () => {
        try {
            const currentMedia = await vlc.getFileName();
            const playlist = await vlc.getPlaylist();
            const currentEntry = playlist.find(entry => entry.isCurrent);
            console.log(`currentMedia Song : ${currentMedia}`);
            console.log(`currentEntry Song : ${JSON.stringify(currentEntry)}`);

            const fullPath = currentEntry.uri.replace('file:///', '');
            console.log(`fullPath Song : ${fullPath}`);

            let playlistContent = '';

            if (fs.existsSync(wplFilePath)) {
                // Read the existing playlist content
                playlistContent = fs.readFileSync(wplFilePath, 'utf8');

                // Find the closing </seq> tag to insert the new song before it
                const closingSeqTagIndex = playlistContent.lastIndexOf('</seq>');
                if (closingSeqTagIndex === -1) {
                    throw new Error("Invalid WPL file format.");
                }

                // Insert the new song before the closing </seq> tag
                const newSongEntry = `    <media src="${fullPath}"/>\n`;
                playlistContent = playlistContent.slice(0, closingSeqTagIndex) + newSongEntry + playlistContent.slice(closingSeqTagIndex);
            } else {
                // Create a new WPL content if the file does not exist
                playlistContent = `
                    <smil>
                        <head>
                            <meta name="Generator" content="Windows Media Player -- 12.0.7601.17514"/>
                            <meta name="ItemCount" content="1"/>
                            <title>Love This Song Playlist</title>
                        </head>
                        <body>
                            <seq>
                                <media src="${fullPath}"/>
                            </seq>
                        </body>
                    </smil>
                `;
            }

            // Write updated content to the .wpl file
            fs.writeFileSync(wplFilePath, playlistContent.trim());
            console.log(`Playlist updated successfully at: ${wplFilePath}`);
        } catch (error) {
            console.error(`Error updating playlist: ${error}`);
            return;
        }
    });
};


const playSongsRandomly = async () => {

    const playlistFileName = process.env.PLAY_LIST_NAME || 'foreign.wpl';
    try {
        console.log('Attempting to add playlist to VLC ...');
        const playlistFilePath = path.join(require('os').homedir(), 'Documents', 'appsAndMore', 'mySongs', 'playlist', playlistFileName);
        await vlc.addToPlaylist(playlistFilePath);
        console.log(`Playlist added : ${playlistFilePath}`);
        await vlc.setRandom(true);
        await vlc.togglePlay();
    } catch (error) {
        console.error(`Error controlling VLC : ${error}`);
    }
};

const pauseOrResume = () => {
    return checkVLCAndProceed(async () => {
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
    deleteCurrentSongAndPlayNext, isVLCRunning
};




