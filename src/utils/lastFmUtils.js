
const Lastfm = require('simple-lastfm');

const apiKey = process.env.justRunItAppKey;

const lastfm = new Lastfm({
  api_key: apiKey,
  username: process.env.lastfmUserName,
  password: process.env.lastfmPassword,
  api_secret: process.env.justRunItAppApiSecret
});

const getSimilarSongs = async (artist, track, limit = 40) => {

  const url = `http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${artist}&track=${track}&api_key=${apiKey}&format=json&limit=${limit}`;

  const response = await fetch(url);
  const data = await response.json();
  const similarTracks = data.similartracks.track;

  console.log('similarTracksFound:', similarTracks.length);
  return similarTracks;

}

const getPopularSongsByGenre = async () => {

  const url = `http://ws.audioscrobbler.com/2.0/?method=geo.gettoptrack&api_key=${apiKey}&format=json`;

  const response = await fetch(url);
  const data = await response.json();
  const tracks = data.tracks.track;

  return tracks;

}



const getLatestTopSong = async (country = 'united states', limit = 21) => {

  const url = `https://ws.audioscrobbler.com/2.0/?method=geo.getTopTracks&country=${country}&api_key=${apiKey}&format=json&limit=${limit}`;

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



module.exports = {
  getSimilarSongs, getPopularSongsByGenre,
  getLatestTopSong, likeThisSong, unLikeThisSong
};



