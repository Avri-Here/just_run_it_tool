



const ytSearch = require('yt-search');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs'), { join } = require('path');
const { initSessionKey, loveAndMarkAsKnown } = require('./lastFmUtils');


const homedir = require('os').homedir();

process.env.BINARIES_DIR = process.env.BINARIES_DIR || join(homedir, 'Documents', 'myBackupFolder', 'binaries');


const ytDlpExe = join(process.env.BINARIES_DIR, 'misc', 'ytDlp');
const ytDlpWrap = new YTDlpWrap(ytDlpExe);



const getYTubeUrlByNames = async (songNames) => {

    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'myBackupFolder', 'songs');
    const discoverDir = join(songsFolder, 'discover');

    if (!fs.existsSync(discoverDir)) {
        fs.mkdirSync(discoverDir, { recursive: true });
    };

    const searchPromises = await songNames.map(async (item) => {

        try {
            const songName = item.name;
            const artistName = item.artist.name || item.artist;
            const query = `${songName} ${artistName}`;
            const result = await ytSearch(query);

            if (!result.videos.length) {
                throw new Error(`No YouTube URL found for song ${songName}`);
            }

            const { url } = result.videos[0];
            return { songName, artistName, url };
        } catch (error) {

            console.error('Error fetching YouTube URL for song:', error);
            throw error;
        }

    });

    // Use Promise.allSettled to wait for all promises to either resolve or reject ..
    const results = await Promise.allSettled(searchPromises);


    const filterResults = results.filter(result => result.status === 'fulfilled').map(({ value }) => value);
    console.log("total songs url found :", filterResults.length);
    return filterResults;

}


// save the file name as the lastFM song name and the artist name if the arr is fill from any lastFm Api !!
const downloadSongsFromYt = async (ytUrlSongs) => {

    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'myBackupFolder', 'songs');
    const downloadDir = join(songsFolder, 'discover');

    try {


        await initSessionKey();
        const downloadSongs = await Promise.allSettled(
            ytUrlSongs.map(async ({ songName, artistName, url }) => {

                try {


                    const fileName = join(downloadDir, songName + ')$(' + artistName) + '.mp3';
                    await ytDlpWrap.execPromise([url, '-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3', '-o', fileName]);

                    await loveAndMarkAsKnown(artistName, songName);
                    console.log('Song downloaded and mark As Known !', songName + ')$(' + artistName + '.mp3');

                } catch (err) {
                    console.error(`Failed to download ${songName} by ${artistName} from ${url}:`, err);
                    throw err;
                }
            })
        );

        const filterReject = downloadSongs.filter(({ status }) => status === 'rejected');
        const filterResolve = downloadSongs.filter(({ status }) => status === 'fulfilled');

        console.log('Total songs downloaded :', filterResolve.length);

        if (filterReject.length) {
            console.error('Total songs failed :', filterReject.length, JSON.stringify(filterReject, null, 2));
        }

        return filterResolve.length;

    } catch (error) {
        console.error('Error downloading songs from YouTube :', error);
        return false;
    }
};

module.exports = { downloadSongsFromYt, getYTubeUrlByNames };

