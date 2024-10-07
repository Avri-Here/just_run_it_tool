
const axios = require('axios');
const Lastfm = require('simple-lastfm');
const baseUrl = 'http://ws.audioscrobbler.com/2.0/';

const apiKey = process.env.justRunItAppKey;
const userName = process.env.lastfmUserName;

const lastfm = new Lastfm({
  api_key: apiKey, username: userName,
  password: process.env.lastfmPassword,
  api_secret: process.env.justRunItAppApiSecret
});


const initSessionKey = async () => {
  return new Promise((resolve, reject) => {
    lastfm.getSessionKey((result) => {
      if (result.success) {
        resolve(result.session_key);
        return;
      }
      reject(result.error);
    });
  });
};


const getRandomItemsFromList = (arr, numItems) => {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numItems);
}


const getSimilarSongs = async (artist, track, limit = 20) => {

  const urlApi = `${baseUrl}?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${apiKey}&format=json&limit=${limit}`;

  const { data } = await axios(urlApi);

  const similartracks = data.similartracks?.track || [];
  return similartracks;

};


// track And artist Required  !!
const getTheSimilarSong = async (track, artist) => {

  const urlApi = `${baseUrl}?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${apiKey}&format=json&limit=1`;


  const { data } = await axios(urlApi);

  if (data.error) {
    console.warn('Warn from Last.fm API - getTheSimilarSong :', data.message);
    return;
  };

  const similarTrack = data.similartracks?.track[0];
  return similarTrack;

};


const getSimilarSongsAndPikeRandom = async (track, artist) => {

  const urlApi = `${baseUrl}?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${apiKey}&format=json&limit=15`;


  const { data } = await axios(urlApi);


  if (data.error) {
    console.warn('Warn from Last.fm API - getTheSimilarSong :', data.message);
    return;
  };


  const randomIndex = Math.floor(Math.random() * 15);
  const similarTrack = data.similartracks?.track[randomIndex];
  return similarTrack;

};

const getLatestTopSongByCountry = async (country = 'united states', limit = 15) => {

  const url = `${baseUrl}?method=geo.getTopTracks&country=${encodeURIComponent(country)}&api_key=${apiKey}&format=json&limit=${limit}`;
  const { data } = await axios(url);
  return data.tracks.track;
};


// just to make it as Known - not really Love it !
const loveAndMarkAsKnown = async (artist, track, initSession) => {

  if (initSession) {
    await initSessionKey()
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


const isSongAlreadyKnown = async (artist, track) => {

  const apiUrl = `${baseUrl}?method=track.getinfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&user=${userName}&format=json`;

  try {

    const { data } = await axios.get(apiUrl);

    if (data.error) {
      console.error('Error from Last.fm API :', data.message);
      throw new Error(data.message);
    };

    const userLoved = Number(data.track.userloved);
    const userPlayCount = Number(data.track.userplaycount);

    // console.log(`isSongAlreadyKnown : ${userPlayCount + userLoved > 0}`);
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
    console.error('Error :', data.message);
  };

  return data.toptracks?.track || [];
}

const discoverReallyNewMusic = async (minSize = 10) => {

  try {
    const topArtists = await getLatestTopArtists(minSize / 2);

    const allTopTracks = await Promise.all(topArtists.map(async (artist) => {
      const topTracks = await getTopSongsByArtist(artist.name, 5);
      return topTracks;
    }));

    const flatAllToOneArr = allTopTracks.flat();
    console.log('All top Songs before filter already played :', flatAllToOneArr.length);

    const filterEverPlayed = await Promise.all(flatAllToOneArr.map(
      async ({ name, artist, url }) => {
        const isSongPlayed = await isSongAlreadyKnown(artist.name, name);
        return isSongPlayed ? null : { name, artist: artist.name, url };
      }));

    const reallyNewSongs = filterEverPlayed.filter((item) => item);

    console.log('All top Songs After filter already played :', reallyNewSongs.length);
    return reallyNewSongs;

  } catch (error) {

    console.error('Error fetching songs :', JSON.stringify(error, null, 2));
    throw error;
  }
};


const getRecommendedByTopHistory = async (minSize) => {

  const limitRes = 70;
  let collectionResults = [];
  const periodArr = ['7day', '1month', '3month', '6month', '12month'];

  while (collectionResults.length < minSize) {

    const randomIndex = Math.floor(Math.random() * periodArr.length);
    const randomPeriod = periodArr[randomIndex];

    const urlApi = `${baseUrl}?method=user.gettoptracks&user=${userName}&api_key=${apiKey}&format=json&limit=${limitRes}&period=${randomPeriod}`;

    try {

      const { data } = await axios.get(urlApi);
      const topTracks = data.toptracks.track;
      const pickRandomTrack = getRandomItemsFromList(topTracks, minSize);

      const similarSongsRes = await Promise.all(pickRandomTrack.map(async ({ name, artist }) => {
        return await getSimilarSongsAndPikeRandom(name, artist.name);
      }));

      const trackFiltered = similarSongsRes.filter((item) => item);

      const filterEverPlayed = await Promise.all(trackFiltered.map(async (item) => {
        const isSongPlayed = await isSongAlreadyKnown(item.artist.name, item.name);
        return isSongPlayed ? null : item;
      }));

      const reallyNewSongs = filterEverPlayed.filter((item) => item);

      if (reallyNewSongs.length) {
        collectionResults = [...collectionResults, ...reallyNewSongs];
      }

      if (collectionResults.length >= minSize) {
        collectionResults = collectionResults.slice(0, minSize);
        break;
      }
    }

    catch (error) {
      console.error('Error fetching songs :', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  return collectionResults;


};



// const getYourLastPlayedTracks = async (limit = 100) => {

//   const url = `${baseUrl}?method=user.getrecenttracks&user=${userName}&api_key=${apiKey}&format=json&limit=${limit}`;

//   const response = await axios.get(url);

//   const lastPlayedTracks = response.data.recenttracks.track;

//   return lastPlayedTracks;

// };


const scrobbleTrackOnLastFm = async (artist, track, initSession) => {

  if (initSession) {
    await initSessionKey().catch((error) => {
      console.error('Failed to initialize session key :', error);
      return null;
    });
  };


  return new Promise((resolve, reject) => {
    lastfm.scrobbleTrack({
      artist, track, callback: (result) => {
        if (result.success) {
          console.log('scrobbleTrack result :', JSON.stringify(result, null, 2));
          resolve({ artist, track });
        } else {
          console.error('scrobbleTrack error :', result.error);
          reject(result.error);
        }
      }
    });
  });
};


const searchTrackByNameAndArtist = async (songName, artist, limit = 1) => {

  try {

    let url = `${baseUrl}?method=track.search&track=${encodeURIComponent(songName)}&api_key=${apiKey}&format=json&limit=${limit}`;

    if (artist) {
      url += `&artist=${encodeURIComponent(artist)}`;
    }

    const { data } = await axios.get(url);

    if (data.results && data.results.trackmatches.track.length > 0) {
      const trackMatches = data.results.trackmatches.track[0];

      console.log('trackMatches :', JSON.stringify(trackMatches, null, 2));
      return { isFound: true, ...trackMatches };
    } else {
      throw new Error('No matching tracks found ..');
    }
  } catch (error) {
    console.error(`Error fetching track info: ${error.message}, ${songName}`);
    return { isFound: false, name: songName };
  }
};



const startDiscoverFlow = async (minSize) => {

  let allNewSongs = [];

  while (allNewSongs.length < minSize) {

    try {
      const tracksRes = await getRecommendedByTopHistory(minSize);

      if (tracksRes) {
        allNewSongs = [...allNewSongs, ...tracksRes];
      };


      if (allNewSongs.length < minSize) {
        console.log(`Not enough songs found -  fetching again ..`);
      }

    }

    catch (error) {
      console.error('Error fetching songs :', JSON.stringify(error, null, 2));
      break;
    }
  }

  return allNewSongs;
};


module.exports = {
  initSessionKey, loveAndMarkAsKnown, scrobbleTrackOnLastFm,
  isSongAlreadyKnown, discoverReallyNewMusic, searchTrackByNameAndArtist,
  getRecommendedByTopHistory, getSimilarSongs, getLatestTopSongByCountry,
};



// async function test() {





//   const recommendedByTopHistory = await getRecommendedByTopHistory(9);
//   console.log('getRecommendedByTopHistory :', recommendedByTopHistory);


// }

// test();

