
const apiKey = process.env.LASTFM_API_KEY;


const getSimilarSongs = async (artist, track) => {

  const url = `http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${artist}&track=${track}&api_key=${apiKey}&format=json`;

  const response = await fetch(url);
  const data = await response.json();
  const similarTracks = data.similartracks.track;

  return similarTracks;

}

const getPopularSongsByGenre = async () => {

  const url = `http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${genre}&api_key=${apiKey}&format=json`;

  const response = await fetch(url);
  const data = await response.json();
  const tracks = data.tracks.track;

  return tracks;

}



const getLatestTopSong = async (country = 'united states', limit = 20) => {


  const url = `https://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=${country}&api_key=${apiKey}&format=json&limit=${limit}`;

  const response = await fetch(url);
  const data = await response.json();
  return data.tracks.track;


}


module.exports = { getSimilarSongs, getPopularSongsByGenre, getLatestTopSong };



