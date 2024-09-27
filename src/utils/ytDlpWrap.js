



const ytSearch = require('yt-search');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs'), { join } = require('path');
const { getAllFilesInDir } = require('./fileExplorer');

const ytDlpExe = join(process.env.BINARIES_DIR, 'misc', 'ytDlp');
const ytDlpWrap = new YTDlpWrap(ytDlpExe);





const normalize = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const getYTubeUrlByNames = async (songNames) => {


    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'appsAndMore', 'mySongs');
    const discoverDir = join(songsFolder, 'discover');

    // Ensure the download directory exists
    if (!fs.existsSync(discoverDir)) {
        fs.mkdirSync(discoverDir, { recursive: true });
    };

    const allFilesInDir = await getAllFilesInDir(discoverDir);

    const filterSongs = songNames.filter(({ name }) => {

        const songName = name;
        return !allFilesInDir.some(file => normalize(file).includes(normalize(songName)));
    });

    console.log(`Skipping ${songNames.length - filterSongs.length} songs that are already downloaded !`);


    const searchPromises = await filterSongs.map(async ({ name, artist }, index) => {

        const songName = name, artistName = artist.name;
        const query = `${songName} ${artistName}`;
        const result = await ytSearch(query);

        console.log('ytSearchUrl - work async :', index + 1 + ' index from', filterSongs.length);

        if (!result.videos.length) {
            throw new Error(`No YouTube URL found for song ${songName}`);
        }

        const { url } = result.videos[0];
        return { songName, artistName, url };

    });

    // Use Promise.allSettled to wait for all promises to either resolve or reject
    const results = await Promise.allSettled(searchPromises);


    const filterResults = results.filter(result => result.status === 'fulfilled').map(({ value }) => value);
    console.log("total songs url found :", filterResults.length);
    return filterResults;

}

const downloadSongsFromYt = async (ytUrlSongs) => {

    
    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'appsAndMore', 'mySongs');
    const downloadDir = join(songsFolder, 'discover');
    const allFilesInDir = await getAllFilesInDir(downloadDir);
    
    if (!ytUrlSongs.length) {

        console.log('All songs are already downloaded !');
        return allFilesInDir.length > 0;
    };

   

    try {


        const downloadSongs = await Promise.allSettled(

            ytUrlSongs.map(async ({ songName, artistName, url }, index) => {


                await ytDlpWrap.execPromise([
                    url, '-f', 'bestaudio',
                    '--extract-audio', '--audio-format', 'mp3',
                    '-o', join(downloadDir, songName + ')$(' + artistName),
                ]);

                // console.log('downloadSong - work async :', index + 1 + ' index from', ytUrlSongs.length);
                return;

            }));


        const filterResolve = downloadSongs.filter(({ status }) => status === 'fulfilled');

        console.log('Total songs downloaded :', filterResolve.length);
        return filterResolve.length + allFilesInDir.length > 0;

    } catch (error) {

        console.error('Error downloading songs from YouTube :', error);
        return false;
    }
};


module.exports = { downloadSongsFromYt, getYTubeUrlByNames };