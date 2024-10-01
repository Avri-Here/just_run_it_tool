
const axios = require('axios');
const { join } = require('path');
const Lastfm = require('simple-lastfm');
const baseUrl = 'http://ws.audioscrobbler.com/2.0/';
const { getAllFilesInDir } = require('./fileExplorer');


const apiKey = process.env.justRunItAppKey;
const userName = process.env.lastfmUserName;

const lastfm = new Lastfm({
  api_key: apiKey,
  username: process.env.lastfmUserName,
  password: process.env.lastfmPassword,
  api_secret: process.env.justRunItAppApiSecret
});



const getSimilarSongs = async (artist, track, limit = 40) => {

  const url = `${baseUrl}?method=track.getsimilar&artist=${artist}&track=${encodeURIComponent(track)}&api_key=${apiKey}&format=json&limit=${limit}`;

  const { data } = await axios(url);

  if (data.error) {
    console.log('Error :', data.message);
    return [];
  }

  const similarTracks = data.similartracks?.track || [];
  console.log('similarTracksFound :', similarTracks.length + ' tracks ..');
  return similarTracks;
};






const getLatestTopSongByCountry = async (country = 'united states', limit = 15) => {

  const url = `${baseUrl}?method=geo.getTopTracks&country=${encodeURIComponent(country)}&api_key=${apiKey}&format=json&limit=${limit}`;
  const { data } = await axios(url);
  return data.tracks.track;
};


const initSessionKey = async () => {
  return new Promise((resolve, reject) => {
    lastfm.getSessionKey((result) => {
      if (result.success) {
        resolve(result.session_key);
      } else {
        reject(result.error);
      }
    });
  });
};


// just to make it as Known - not really Love it !
const scrobbleTrackOnLastFm = async (artist, track, initSession) => {

  if (initSession) {
    await initSessionKey();
  }

  return new Promise((resolve, reject) => {
    lastfm.scrobbleTrack({
      artist, track, callback: (result) => {
        if (result.success) {
          console.log(`scrobbleTrack : ${track} by ${artist}`);
          resolve({ artist, track });
        } else {
          console.error('scrobbleTrack error :', result.error);
          reject(result.error);
        }
      }
    });
  });
};

// just to make it as Known - not really Love it !
const loveAndMarkAsKnown = async (artist, track, initSession) => {

  if (initSession) {
    await initSessionKey();
  };

  return new Promise((resolve, reject) => {
    lastfm.loveTrack({
      artist, track, callback: (result) => {
        if (result.success) {
          console.log(`Success ! loveAndMarkAsKnown - track: ${track} by ${artist} ..`);
          resolve({ track, artist });
        } else {
          console.log('loveAndMarkAsKnown error :', result.error);
          reject(result.error);
        }
      }
    });
  });
}


// const likeAndScrobbleTrack = async (artist, track) => {
//   return new Promise(async (resolve, reject) => {
//     await getSessionKey().catch((error) => reject(error));
//     lastfm.loveTrack({
//       artist, track, callback: async (result) => {
//         if (result.success) {
//           console.log(`Loved track: ${track} by ${artist}`);
//           await scrobbleTrack(artist, track).catch((error) => reject(error));
//           resolve(result);
//         } else {
//           reject(result.error);
//         }
//       }
//     });
//   });
// };


// const submitTrack = async (artist, track) => {
//   return new Promise(async (resolve, reject) => {
//     // await getSessionKey().catch((error) => reject(error));
//     lastfm.loveTrack({
//       artist, track, callback: async (result) => {
//         if (result.success) {
//           console.log(`Loved track: ${track} by ${artist}`);
//           await scrobbleTrack(artist, track).catch((error) => reject(error));
//           resolve(result);
//         } else {
//           reject(result.error);
//         }
//       }
//     });
//   });
// };


// const unLikeThisSong = async (artist, track) => {
//   // await getSessionKey().catch((error) => reject(error));
//   return new Promise(async (resolve, reject) => {
//     lastfm.unloveTrack({
//       artist, track, callback: (result) => {
//         if (result.success) {
//           console.log(`Unloved track: ${track} by ${artist}`);
//           resolve(result);
//         } else {
//           reject(result.error);
//         }
//       }
//     });
//   });
// };


const isSongAlreadyPlayed = async (artist, track) => {


  const apiUrl = `${baseUrl}?method=track.getinfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&user=${userName}&format=json`;

  try {

    const { data } = await axios.get(apiUrl);

    if (data.error) {
      console.error('Error from Last.fm API :', data.message);
      throw new Error(data.message);
    };

    const userLoved = Number(data.track.userloved);
    const userPlayCount = Number(data.track.userplaycount);

    console.log(`isSongAlreadyPlayed : ${track} by ${artist} - userPlayCount : ${userPlayCount}, userLoved : ${userLoved}`);
    return userPlayCount + userLoved > 0;

  } catch (error) {

    console.log('Error from Last.fm API :', error.message);
    return false;
  }
};



const getLatestTopArtists = async (limit = 5) => {

  const urlApi = `${baseUrl}?method=chart.getTopArtists&api_key=${apiKey}&format=json&limit=${limit}`;

  const { data } = await axios.get(urlApi);

  if (data.error) {
    throw new Error(data.message);
  };

  const topArtists = data.artists.artist;
  return topArtists;

}

const getTopSongsByArtist = async (artist, limit = 5) => {

  console.log('Get top songs by artistName : ', artist);

  const urlApi = `${baseUrl}?method=artist.gettoptracks&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&format=json&limit=${limit}`;

  const { data } = await axios.get(urlApi);

  if (data.error) {
    throw new Error(data.message);
  };

  return data.toptracks.track;
}



// latest top songs by Top Artists !
const discoverReallyNewMusic = async (limit = 10) => {

  try {
    const topArtists = await getLatestTopArtists(limit);
    const allTopTracks = await Promise.all(topArtists.map(async (artist) => {

      const topTracks = await getTopSongsByArtist(artist.name, 2);
      // const topTracks = await getTopSongsByArtist(artist.name, 5);

      if (!topTracks.length) {

        console.log('No top tracks found for this Artists .');
        return [];
      }

      return topTracks;
    }));


    const flatAllToOneArr = allTopTracks.flat();
    console.log('All top Songs before filter already played :', flatAllToOneArr.length);

    // Use map to create an array of promises, then await Promise.all to resolve them
    const filterEverPlayed = await Promise.all(flatAllToOneArr.map(
      async ({ name, artist }) => {
        const isSongPlayed = await isSongAlreadyPlayed(artist.name, name);
        return !isSongPlayed;
      }));

    const reallyNewSongs = flatAllToOneArr.filter((_, index) => filterEverPlayed[index]);

    console.log('All top Songs After filter already played :', reallyNewSongs.length);
    return reallyNewSongs;

  } catch (error) {

    console.error('Error fetching songs :', JSON.stringify(error, null, 2));
    throw error;
  }
};

const getYourTopTracks = async (limit = 10) => {

  const USERNAME = process.env.lastfmUserName;

  console.log('USERNAME:', USERNAME);


  const url = `${baseUrl}?method=user.gettoptracks&user=${USERNAME}&api_key=${apiKey}&format=json&limit=${limit}`;

  const response = await axios.get(url);
  const topTracks = response.data.toptracks.track;
  return topTracks;

};



// const discoverYourRecommendedMusic3 = async (limit = 10) => {

//   try {
//     const yourTopTracks = await getYourTopTracks(limit);

//     for (const track of yourTopTracks) {

//       const artist = track.artist.name;
//       const trackName = track.name;
//       console.log(`Top Track: ${trackName} by ${artist}`);

//       const similarTracks = await getSimilarSongs(artist, trackName, 2);
//       // similarTracks.forEach(similarTrack => {
//       //   console.log(`Recommended Track : ${similarTrack.name} by ${similarTrack.artist.name}`);
//       // });
//     };

//     const filterEverPlayed = await Promise.all(similarTracks.map(async ({ name, artist }) => {
//       const isSongPlayed = await isSongAlreadyPlayed(artist.name, name);
//       return !isSongPlayed;
//     }));

//     const reallyNewSongs = similarTracks.filter((_, index) => filterEverPlayed[index]);

//     return reallyNewSongs;




//   } catch (error) {

//     console.error('Error fetching songs :', JSON.stringify(error, null, 2));
//     throw error;
//   }
// };


// // This not a searchTracksByArtistAndTitle !
// const getTrackInfoByArtistAndTrack = async (artist, track) => {

//   return new Promise(async (resolve, reject) => {
//     await getSessionKey().catch((error) => reject(error));
//     lastfm.getTrackInfo({
//       artist, track, callback: async (result) => {
//         if (result.success) {
//           console.log(`getTrackInfo : ${JSON.stringify(result.trackInfo, null, 2)}`);
//           resolve(result);
//         } else {
//           reject(result.error);
//         }
//       }
//     });
//   });

// }


const searchTrackByName = async (songName, artist = '') => {

  try {

    const url = `${baseUrl}?method=track.search&track=${encodeURIComponent(songName)}&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&format=json&limit=1`;
    const { data } = await axios.get(url);

    if (data.results && data.results.trackmatches.track.length > 0) {
      const trackMatches = data.results.trackmatches.track[0];
      return { isFound: true, ...trackMatches };
    } else {
      throw new Error('No matching tracks found ..');
    }
  } catch (error) {
    console.error(`Error fetching track info: ${error.message}, ${songName}`);

    return { isFound: false, name: songName };
  }
};


// const discoverYourRecommendedMusic = async (limit = 2) => {

//   try {
//     const yourTopTracks = await getYourTopTracks(limit);

//     let allSimilarTracks = [];

//     for (const track of yourTopTracks) {
//       const artist = track.artist.name;
//       const trackName = track.name;
//       console.log(`Top Track: ${trackName} by ${artist}`);

//       const similarTracks = await getSimilarSongs(artist, trackName, 2);
//       allSimilarTracks = allSimilarTracks.concat(similarTracks);
//     }

//     console.log('allSimilarTracksNoFilter :', allSimilarTracks.length);



//     const filterEverPlayed = await Promise.all(allSimilarTracks.map(async ({ name, artist }) => {
//       const isSongPlayed = await isSongAlreadyPlayed(artist.name, name);
//       return !isSongPlayed;
//     }));

//     const reallyNewSongs = allSimilarTracks.filter((_, index) => filterEverPlayed[index]).map(({ url, name, artist }) => ({ name, artist: artist.name, url }));

//     console.log('allSimilarTracksAfterFilter :', reallyNewSongs.length);

//     return reallyNewSongs;
//   } catch (error) {
//     console.error('Error fetching songs:', JSON.stringify(error, null, 2));
//     throw error;
//   }
// };

const discoverYourRecommendedMusic = async (limit = 2) => {

  try {

    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'appsAndMore', 'mySongs');
    const discoverDir = join(songsFolder, 'discover');



    const allFilesInDir = await getAllFilesInDir(discoverDir);

    console.log('allFilesInDir:', allFilesInDir.length);
    

    if (allFilesInDir.length >= 10) {

      // console.log('You have enough songs in your discover folder !');
      return 'youDiscoverFolderIsFull';
    };


    let allNewSongs = [];

    while (allNewSongs.length < limit) {
      const yourTopTracks = await getYourTopTracks(limit);

      let allSimilarTracks = [];

      for (const track of yourTopTracks) {
        const artist = track.artist.name;
        const trackName = track.name;
        console.log(`Top Track: ${trackName} by ${artist}`);

        const similarTracks = await getSimilarSongs(artist, trackName, limit); // Fetch multiple songs
        allSimilarTracks = allSimilarTracks.concat(similarTracks);
      }

      console.log('allSimilarTracksNoFilter:', allSimilarTracks.length);

      const filterEverPlayed = await Promise.all(
        allSimilarTracks.map(async ({ name, artist }) => {
          const isSongPlayed = await isSongAlreadyPlayed(artist.name, name);
          return !isSongPlayed;
        })
      );

      const newSongs = allSimilarTracks
        .filter((_, index) => filterEverPlayed[index])
        .map(({ url, name, artist }) => ({ name, artist: artist.name, url }));

      console.log('allSimilarTracksAfterFilter:', newSongs.length);

      // Add only the new songs that haven't been played
      allNewSongs = allNewSongs.concat(newSongs);

      // If we still haven't reached the limit, continue fetching more recommendations
      if (allNewSongs.length < limit) {
        console.log(`Not enough songs found, fetching more...`);
      }
    }

    return allNewSongs.slice(0, limit);
  } catch (error) {
    console.error('Error fetching songs:', JSON.stringify(error, null, 2));
    throw error;
  }
};


module.exports = {
  loveAndMarkAsKnown, initSessionKey,
  isSongAlreadyPlayed,
  discoverReallyNewMusic, searchTrackByName,
  getSimilarSongs, getLatestTopSongByCountry,
  scrobbleTrackOnLastFm, discoverYourRecommendedMusic
};