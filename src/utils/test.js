// // const fetch = require('node-fetch');

const apiKey = '49fd2a9b364ccbe381115a5625e19fb0'; // הכנס את מפתח ה-API שלך כאן

// // משתנה שיכיל את כל השירים מכל האמנים
// let allTopTracks = [];

// // פונקציה לקבלת השירים המובילים של אמן
// function getTopTracks(artistName) {
//     const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTracks&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json&limit=5`;

//     return fetch(url)
//         .then(response => response.json())
//         .then(data => {
//             const topTracks = data.toptracks.track.map(track => ({ name: track.name, artist: track.artist.name }));
//             return topTracks;  // מחזיר את רשימת השירים של האמן
//         })
//         .catch(error => {
//             console.error('Error fetching top tracks:', error);
//             return []; // במקרה של שגיאה, נחזיר מערך ריק כדי לא לשבור את הלוגיקה
//         });
// }

// // פונקציה לקבלת האמנים המובילים
function getTopArtists() {
    const url = `https://ws.audioscrobbler.com/2.0/?method=chart.getTopArtists&api_key=${apiKey}&format=json&limit=7`;

    fetch(url)
        .then(response => response.json())
        .then(async (data) => {
            const topArtists = data.artists.artist;

            // נעבור על כל אמן ונקבל את השירים המובילים
            for (const artist of topArtists) {
                console.log(`Fetching top tracks for artist: ${artist.name}`);
                const topTracks = await getTopTracks(artist.name); // ממתינים לנתונים של כל אמן
                allTopTracks = allTopTracks.concat(topTracks); // ממזגים את השירים למערך אחד
            }

            console.log('All top tracks:', allTopTracks); // מדפיס את כל השירים הממוזגים
        })
        .catch(error => {
            console.error('Error fetching top artists:', error);
        });
}

// // קריאה לפונקציה שמביאה את האמנים המובילים
// getTopArtists();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');

const API_KEY = '49fd2a9b364ccbe381115a5625e19fb0';
const USERNAME = 'AvriHere';
const BASE_URL = 'http://ws.audioscrobbler.com/2.0/';

// Function to get similar tracks based on top tracks
async function getSimilarTracks() {

    const url = `https://ws.audioscrobbler.com/2.0/?method=chart.getTopArtists&api_key=${apiKey}&format=json&limit=1`;


    const { data } = await axios.get(url);

    console.log({ data });


    const topArtists = data.artists.artist[0].name;
    // const topArtists = 'AvriHere';

    console.log({ topArtists });

    // const url = `https://ws.audioscrobbler.com/2.0/?method=chart.getTopArtists&api_key=${apiKey}&format=json&limit=1`;
    const url3 = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${topArtists}&api_key=${apiKey}&format=json&limit=1`;


    try {

        const data3 = await axios.get(url3);

        console.log({ data: data3.data.toptracks.track });
        //     const topTracksResponse = await axios.get(BASE_URL, {
        //         params: {
        //             method: 'user.getTopTracks',
        //             user: USERNAME.trim(),
        //             api_key: API_KEY,
        //             format: 'json',
        //         },
        //     });

        //     const topTracks = topTracksResponse.data.toptracks.track;

        //     if (topTracks.length === 0) {
        //         console.log('No top tracks found for this user.');
        //         return;
        //     }

        //     console.log('Top tracks:', JSON.stringify(topTracks, null, 2));

        //     const track = topTracks[Math.floor(Math.random() * topTracks.length)]; // Pick a random top track

        //     const similarTracksResponse = await axios.get(BASE_URL, {
        //         params: {
        //             method: 'track.getSimilar',
        //             artist: track.artist.name,
        //             track: track.name,
        //             api_key: API_KEY,
        //             format: 'json',
        //         },
        //     });

        //     const similarTracks = similarTracksResponse.data.similartracks.track;

        //     console.log('Similar tracks:', JSON.stringify(similarTracks, null, 2));

        //     const newSongs = similarTracks.filter((song) => !song.hasOwnProperty('playcount'));

        //     console.log('Songs you might like that you haven\'t played before:');
        //     newSongs.forEach((song) => {
        //         console.log(`${song.name} by ${song.artist.name}`);
        //     });
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

getSimilarTracks();
