

const axios = require('axios');
const Lastfm = require('simple-lastfm');
const baseUrl = 'https://ws.audioscrobbler.com/2.0/';


const apiKey = process.env.justRunItAppKey;

const lastfm = new Lastfm({
  api_key: apiKey,
  username: process.env.lastfmUserName,
  password: process.env.lastfmPassword,
  api_secret: process.env.justRunItAppApiSecret
});

const getSimilarSongs = async (artist, track, limit = 40) => {


  const url = `http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${artist}&track=${track.trim()}&api_key=${apiKey}&format=json&limit=${limit}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    console.log('Error :', data.message);
    return [];
  }

  const similarTracks = data.similartracks?.track || [];
  console.log('similarTracksFound:', similarTracks.length);
  console.log('similarTracks:', JSON.stringify(similarTracks, null, 2));


  return similarTracks;
};


const getPopularSongsByGenre = async () => {

  const url = `http://ws.audioscrobbler.com/2.0/?method=geo.gettoptrack&api_key=${apiKey}&format=json`;

  const response = await fetch(url);
  const data = await response.json();
  const tracks = data.tracks.track;

  return tracks;

}



const getLatestTopSong = async (country = 'united states', limit = 15) => {

  const url = `https://ws.audioscrobbler.com/2.0/?method=geo.getTopTracks&country=${encodeURIComponent(country)}&api_key=${apiKey}&format=json&limit=${limit}`;

  const response = await fetch(url);
  const data = await response.json();
  return data.tracks.track;
}



const getSessionKey = async () => {
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

const scrobbleTrack = async (artist, track) => {
  return new Promise((resolve, reject) => {
    lastfm.scrobbleTrack({
      artist, track, callback: (result) => {
        if (result.success) {
          console.log(`Scrobbled track: ${track} by ${artist}`);
          resolve(result);
        } else {
          reject(result.error);
        }
      }
    });
  });
};

const likeThisSong = async (artist, track) => {
  return new Promise(async (resolve, reject) => {
    await getSessionKey().catch((error) => reject(error));
    lastfm.loveTrack({
      artist, track, callback: async (result) => {
        if (result.success) {
          console.log(`Loved track: ${track} by ${artist}`);
          await scrobbleTrack(artist, track).catch((error) => reject(error));
          resolve(result);
        } else {
          reject(result.error);
        }
      }
    });
  });
};


const unLikeThisSong = async (artist, track) => {
  return new Promise(async (resolve, reject) => {
    await getSessionKey().catch((error) => reject(error));
    lastfm.unloveTrack({
      artist, track, callback: (result) => {
        if (result.success) {
          console.log(`Unloved track: ${track} by ${artist}`);
          resolve(result);
        } else {
          reject(result.error);
        }
      }
    });
  });
};


const isSongAlreadyPlayed = async (artist, track) => {

  console.log('Check if song already played :', { artist }, { track });


  const userName = 'AvriHere';
  const apiUrl = `${baseUrl}?method=track.getinfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&user=${userName}&format=json`;

  try {

    const { data } = await axios.get(apiUrl);

    if (data.error) {
      console.error('Error from Last.fm API :', data.message);
      throw new Error(data.message);
    };

    const userPlayCount = Number(data.track.userplaycount)
    const userLoved = Number(data.track.userloved);

    return userPlayCount > 0 || userLoved === 1;

  } catch (error) {

    console.log('Error from Last.fm API :', error.message);
    return false;
  }
};

const getLatestTopArtists = async (limit) => {

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


const discoverReallyNewMusic = async (limit = 20) => {

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


module.exports = {
  discoverReallyNewMusic,
  getLatestTopSong, likeThisSong,
  isSongAlreadyPlayed, unLikeThisSong,
  getSimilarSongs, getPopularSongsByGenre,
};


// discoverReallyNewMusic()




// const artist = 'NF', track = `JUST LIKE YOUe (AutoPlay)`
// hasUserPlayedSong(artist, track);