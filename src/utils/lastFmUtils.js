
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



const getSimilarSongs = async (artist, track, limit = 40) => {

  const urlApi = `${baseUrl}?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${apiKey}&format=json&limit=${limit}`;

  const { data } = await axios(urlApi);

  if (data.error) {
    console.log('Error :', data.message);
    return null;
  }

  const similartracks = data.similartracks.track[0];

  if (!similartracks) {
    console.log('No similar tracks found for this song ..');
    return null;
  }





  console.log('similartracks:', JSON.stringify(similartracks, null, 2));

  const isSongPlayed = await isSongAlreadyKnown(similartracks.artist.name, similartracks.name);

  if (isSongPlayed) {
    console.log(`Track "${track}" by "${artist}" already played !`);
    return null;
  };


  return { artist: similartracks.artist.name, name: similartracks.name, url: similartracks.url }
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

    console.log(`isSongAlreadyKnown : ${track} by ${artist} - userPlayCount : ${userPlayCount}, userLoved : ${userLoved}`);
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
        const isSongPlayed = await isSongAlreadyKnown(artist.name, name);
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


const getRecommendedByTopHistory = async (maxSize = 5, limit = 100) => {

  const periodArr = ['7day', '1month', '3month', '6month', '12month'];

  const randomIndex = Math.floor(Math.random() * periodArr.length);
  const randomPeriod = periodArr[randomIndex];
  console.log('Selected Period :', randomPeriod);

  const url = `${baseUrl}?method=user.gettoptracks&user=${userName}&api_key=${apiKey}&format=json&limit=100&period=${randomPeriod}`;

  let filterNullObjects = []
  try {
    const response = await axios.get(url);
    const topTracks = response.data.toptracks.track;

    const trackLimit = Math.min(topTracks.length, limit);

    // Create a set to ensure we get unique random tracks
    const randomTracksSet = new Set();
    while (randomTracksSet.size < maxSize && filterNullObjects.length < maxSize) {
      const randomTrackIndex = Math.floor(Math.random() * trackLimit);
      randomTracksSet.add(topTracks[randomTrackIndex]);
    };

    const pickRandomTrackRes = Array.from(randomTracksSet);

    console.log('pickRandomTrackRes:', pickRandomTrackRes.map(({ name, artist }) => `${name} by ${artist.name}`));

    const similarSongsRes = await Promise.all(pickRandomTrackRes.map(async ({ artist, name }) => {
      const similarTracks = await getSimilarSongs(artist.name, name, 1);
      return similarTracks;
    }));

    filterNullObjects = [...filterNullObjects, ...similarSongsRes.filter((similarSongs) => similarSongs)];
    // const filterNullObjects = similarSongsRes.filter((similarSongs) => similarSongs);

    console.log('filterNullObjects:', JSON.stringify(filterNullObjects, null, 2));

    // const similarSongs = similarSongsRes.filter((similarSongs) => similarSongs).map(({ name, artist }) => { name, artist.name });

    // console.log('similarSongs:', JSON.stringify(similarSongs, null, 2));
    // return similarSongsRes;


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
      return { isFound: true, ...trackMatches };
    } else {
      throw new Error('No matching tracks found ..');
    }
  } catch (error) {
    console.error(`Error fetching track info: ${error.message}, ${songName}`);
    return { isFound: false, name: songName };
  }
};



const discoverYourRecommendedMusic = async (limit) => {

  try {

    const homedir = require('os').homedir();
    const songsFolder = join(homedir, 'Documents', 'appsAndMore', 'mySongs');
    const discoverDir = join(songsFolder, 'discover');



    const allFilesInDir = await getAllFilesInDir(discoverDir);

    console.log('allFilesInDir:', allFilesInDir.length);


    if (allFilesInDir.length >= 15) {
      return 'youDiscoverFolderIsFull';
    };


    let allNewSongs = [];

    while (allNewSongs.length < limit) {

      const mathRandomDiction = Math.random() > 0.5;
      const yourTopTracks = mathRandomDiction ? await discoverReallyNewMusic(limit) : await getRecommendedByTopHistory()
      // const yourTopTracks = mathRandomDiction ? await getYourTopTracks(limit) : await getYourLastPlayedTracks(limit);
      console.info('mathRandom diction :', mathRandomDiction ? 'discoverReallyNewMusic' : 'LastPlayedTracks');
      // const yourTopTracks = await getYourTopTracks(limit);

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
          const isSongPlayed = await isSongAlreadyKnown(artist.name, name);
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
  isSongAlreadyKnown,
  loveAndMarkAsKnown, initSessionKey,
  getSimilarSongs, getLatestTopSongByCountry,
  discoverReallyNewMusic, searchTrackByNameAndArtist,
  scrobbleTrackOnLastFm, discoverYourRecommendedMusic
};



getRecommendedByTopHistory();