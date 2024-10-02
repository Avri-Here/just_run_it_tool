
const axios = require('axios');
const { join } = require('path');
const Lastfm = require('simple-lastfm');
const baseUrl = 'http://ws.audioscrobbler.com/2.0/';
const { getAllFilesInDir } = require('./fileExplorer');


const apiKey = process.env.justRunItAppKey;
const userName = process.env.lastfmUserName;

const lastfm = new Lastfm({
  api_key: apiKey, username: userName,
  password: process.env.lastfmPassword,
  api_secret: process.env.justRunItAppApiSecret
});

const getRandomItems = (arr, numItems) => {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numItems);
}

const getSimilarSongs = async (artist, track, limit = 40) => {


  const urlApi = `${baseUrl}?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${apiKey}&format=json&limit=${limit}`;

  const { data } = await axios(urlApi);

  const similartracks = data.similartracks?.track || [];
  return similartracks.map(({ name, artist, url }) => ({ name, artist: artist.name, url }));



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


const isThisTrackValid = async (artist, track) => {

  const url = `${baseUrl}?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;

  try {


    const { data } = await axios(url);

    console.log('trackData :', JSON.stringify(data, null, 2));

    const isValid = data.track && data.track.streamable['#text'] === '1';

    if (!isValid) {

      console.error(`Track "${track}" by "${artist}" not found or not streamAble !`);
      return false;
    }

    console.log(`Track "${track}" by "${artist}" is streamAble ! Proceeding to scrobble ...`);
    return true;
  }

  catch (error) {
    console.error('Error fetching track data:', error);
    throw new Error('Failed to validate track ..');
  }
};

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

    console.log(`isSongAlreadyKnown : ${userPlayCount + userLoved > 0}`);
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



// latest top songs by Top Artists !
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


const getRecommendedByTopHistory = async (maxSize) => {

  const periodArr = ['7day', '1month', '3month', '6month', '12month'];

  const randomIndex = Math.floor(Math.random() * periodArr.length);
  const randomPeriod = periodArr[randomIndex];

  const limitRes = 100;
  const urlApi = `${baseUrl}?method=user.gettoptracks&user=${userName}&api_key=${apiKey}&format=json&limit=${limitRes}&period=${randomPeriod}`;

  try {

    const response = await axios.get(urlApi);
    const topTracks = response.data.toptracks.track;
    const pick4RandomTrack = getRandomItems(topTracks, maxSize);

    console.log('pick4RandomTrack :', pick4RandomTrack.length);

    const similarSongsRes = await Promise.all(pick4RandomTrack.map(
      async ({ artist, name }) => {
        const [similarTracks] = await getSimilarSongs(artist.name, name, 1);
        return similarTracks;
      }));

    const trackFiltered = similarSongsRes.filter((item) => item);
    console.log('similarSongsRes :', similarSongsRes.length);

    return trackFiltered.length ? trackFiltered : null;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
};



const getYourLastPlayedTracks = async (limit = 100) => {

  const url = `${baseUrl}?method=user.getrecenttracks&user=${userName}&api_key=${apiKey}&format=json&limit=${limit}`;

  const response = await axios.get(url);

  const lastPlayedTracks = response.data.recenttracks.track;

  return lastPlayedTracks;

};


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

    const url = `${baseUrl}?method=track.search&track=${encodeURIComponent(songName)}&artist=${encodeURIComponent(artist || '')}&api_key=${apiKey}&format=json&limit=${limit}`;
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

      console.log('tracksRes :', tracksRes.length);

      if (tracksRes) {
        allNewSongs = [...allNewSongs, ...tracksRes];
        console.log('tracksRes :', tracksRes.length);
      };


      if (allNewSongs.length < minSize) {
        console.log(`Not enough songs found -  fetching again ..`);
      }

    }

    catch (error) {
      console.error('Error fetching songs:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  return allNewSongs;
};


module.exports = {
  isSongAlreadyKnown,
  loveAndMarkAsKnown, initSessionKey,
  scrobbleTrackOnLastFm, startDiscoverFlow,
  getSimilarSongs, getLatestTopSongByCountry,
  discoverReallyNewMusic, searchTrackByNameAndArtist
};



// const mathRandomDiction = Math.random() > 0.5;

// const tracksRes = mathRandomDiction
// ? await discoverReallyNewMusic(minSize)
// : await getRecommendedByTopHistory(minSize);

// console.info('mathRandom diction :', mathRandomDiction ? 'discoverReallyNewMusic' : 'getRecommendedByTopHistory');



