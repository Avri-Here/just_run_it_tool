



const ytSearch = require('yt-search');
const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs'), { join } = require('path');
const { getAllFilesInDir } = require('./fileExplorer');

const ytDlpExe = join(process.env.BINARIES_DIR, 'misc', 'ytDlp');
const ytDlpWrap = new YTDlpWrap(ytDlpExe);






const getYTubeUrlByNames = async (songNames) => {

    const searchPromises = songNames.map(async ({ name, artist }) => {

        const songName = name, artistName = artist.name;

        // console.log(`Searching : ${songName} by ${artistName}`);


        const query = `${songName} ${artistName}`;
        const result = await ytSearch(query);

        if (!result.videos.length) {
            throw new Error(`No YouTube URL found for song ${songName}`);
        }

        const { url } = result.videos[0];
        console.log(`YouTube URL for song ${songName} is : ${url}`);
        // return url;
        return { songName, url };

    });

    // Use Promise.allSettled to wait for all promises to either resolve or reject
    const results = await Promise.allSettled(searchPromises);

    const filterResults = results.filter(result => result.status === 'fulfilled').map(({ value }) => value);

    return filterResults;

}
// const getYTubeUrlBySongName = async (songName, artistName) => {

//     const query = `${songName} ${artistName}`;
//     const result = await ytSearch(query);

//     if (result.videos.length > 0) {
//         const { url } = result.videos[0];
//         console.log(`YouTube URL for song ${songName} is : ${url}`);
//         return url;
//     }

//     throw new Error(`No YouTube URL found for song ${songName}`);
// }



const downloadSongsFromYt = async (ytUrlSongs) => {

    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'appsAndMore', 'mySongs');
    const downloadDir = join(songsFolder, 'discover');

    // Ensure the download directory exists
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }

    const allFilesInDir = await getAllFilesInDir(downloadDir);

    console.log('ytUrlSongs : ', ytUrlSongs);
    console.log('allFilesInDir : ', allFilesInDir);
    



    const filterYtUrlSongs = ytUrlSongs.filter(({ songName }) => {
        return !allFilesInDir.some(file => file.includes(songName));
    });
    
    if (!filterYtUrlSongs.length) {
        console.log('All songs are already downloaded !');
        return allFilesInDir.length;
    }
    


    // Create an array of promises for downloading each song
    const downloadSongs = filterYtUrlSongs.map(async ({ songName, url }) => {

        console.log(`Downloading : ${songName}`);

        return await ytDlpWrap.execPromise([
            url, '-f', 'bestaudio',
            '--extract-audio', '--audio-format', 'mp3',
            '-o', join(downloadDir, '%(title)s.%(ext)s')
        ]);

        // return songName;

    });

    const results = await Promise.allSettled(downloadSongs);
    console.log('Downloads completed ! ', JSON.stringify(results, null, 2));

    const filterResolve =  results.filter(({ status }) => status === 'fulfilled');
    
    return filterResolve.length || allFilesInDir.length;

};


module.exports = { downloadSongsFromYt, getYTubeUrlByNames };