



const ytSearch = require('yt-search');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs'), { join } = require('path');
const { getAllFilesInDir } = require('./fileExplorer');
const { initSessionKey, loveAndMarkAsKnown } = require('./lastFmUtils');


const homedir = require('os').homedir();

process.env.BINARIES_DIR = process.env.BINARIES_DIR || join(homedir, 'Documents', 'appsAndMore', 'binaries');


const ytDlpExe = join(process.env.BINARIES_DIR, 'misc', 'ytDlp');
const ytDlpWrap = new YTDlpWrap(ytDlpExe);



const getYTubeUrlByNames = async (songNames) => {


    console.log('getYTubeUrlByNames :', JSON.stringify(songNames, null, 2));
    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'appsAndMore', 'mySongs');
    const discoverDir = join(songsFolder, 'discover');

    if (!fs.existsSync(discoverDir)) {
        fs.mkdirSync(discoverDir, { recursive: true });
    };

    const searchPromises = await songNames.map(async (item, index) => {

        try {
            const artistName = item.artist?.name || item.artist;
            const songName = item.name || item.title;
            const query = `${songName} ${artistName}`;
            const result = await ytSearch(query);

            console.log('ytSearchUrl - work async :', index + 1 + ' index from', songNames.length);

            if (!result.videos.length) {
                throw new Error(`No YouTube URL found for song ${songName}`);
            }

            const { url } = result.videos[0];
            return { songName, artistName, url };
        } catch (error) {

            console.error('Error fetching YouTube URL for song:', error);
            throw error
        }

    });

    // Use Promise.allSettled to wait for all promises to either resolve or reject
    const results = await Promise.allSettled(searchPromises);


    const filterResults = results.filter(result => result.status === 'fulfilled').map(({ value }) => value);
    console.log("total songs url found :", filterResults.length);
    return filterResults;

}


// save the file name as the lastFM song name and the artist name if the arr is fill from any lastFm Api !!
const downloadSongsFromYt = async (ytUrlSongs) => {

    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'appsAndMore', 'mySongs');
    const downloadDir = join(songsFolder, 'discover');

    const sessionKey = await initSessionKey().catch((error) => {
        console.error('Failed to initialize session key :', error);
        return null;
    });

    if (!sessionKey) {
        return;
    };

    try {
        const downloadSongs = await Promise.allSettled(
            ytUrlSongs.map(async ({ songName, artistName, url }) => {

                try {
                    await ytDlpWrap.execPromise([
                        url, '-f', 'bestaudio',
                        '--extract-audio', '--audio-format', 'mp3',
                        '-o', join(downloadDir, songName + ')$(' + artistName),
                    ]);

                    await loveAndMarkAsKnown(artistName, songName);
                    console.log('song downloaded and mark As Known !', songName + ')$(' + artistName + '.mp3');

                } catch (err) {
                    // Log the specific error for this song
                    console.error(`Failed to download ${songName} by ${artistName} from ${url}:`, err);
                    throw err;  // rethrow to be caught by Promise.allSettled as 'rejected'
                }
            })
        );

        const filterReject = downloadSongs.filter(({ status }) => status === 'rejected');
        const filterResolve = downloadSongs.filter(({ status }) => status === 'fulfilled');

        console.log('Total songs downloaded :', filterResolve.length);

        if (filterReject.length) {
            // Log rejected downloads with details
            console.error('Total songs failed :', filterReject.length, JSON.stringify(filterReject, null, 2));
        }

        return filterResolve.length;

    } catch (error) {
        console.error('Error downloading songs from YouTube :', error);
        return false;
    }
};

module.exports = { downloadSongsFromYt, getYTubeUrlByNames };

