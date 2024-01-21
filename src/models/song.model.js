const mongoose = require('mongoose');
const Genre = require('./genre.model');
const Artist = require('./artist.model');
const Album = require('./album.model');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true, name: String },
  album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true, title: String },
  albumCover: { type: String },
  audio: { type: String, required:  true },
  duration: { type: Number, required: true },
  numberOfListens: { type: Number, default: 0 },
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
