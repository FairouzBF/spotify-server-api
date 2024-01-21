const fs = require('fs').promises;
const Song = require('../models/song.model');
const {songUpload} = require('../middleware/multer');
const {importSongFromFile} = require('../utils/fileCreator');

const Ffmpeg = require('fluent-ffmpeg');

async function convertToM4A(filePath) {
  return new Promise((resolve, reject) => {
    const outputFilePath = filePath.replace(/\..+$/, '.m4a');

    Ffmpeg(filePath)
      .audioCodec('aac')
      .toFormat('ipod')
      .on('end', () => resolve(outputFilePath))
      .on('error', (err) => reject(new Error(`Error converting to WAV: ${err.message}`)))
      .save(outputFilePath);
  });
}

exports.addSong = async (req, res, next) => {
  songUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ message: 'Error during file upload.' });
    }
    try {
      console.log('Received a request to add songs:', req.files);

      if (req.files.length > 10000) {
        // If more than 10 files are uploaded, handle the error
        return res.status(400).json({ message: 'Exceeded maximum number of allowed files (10000).' });
      }

      const addedSongs = [];

      // Loop through each file and process it
      for (const file of req.files) {
        const filePath = file.path;

        const fileExtension = filePath.split('.').pop().toLowerCase();
        if (fileExtension === 'm4a') {
          // If already m4a, proceed with song import directly
          const addedSong = await importSongFromFile(filePath);
          addedSongs.push(addedSong);
        } else {
          // If not m4a, convert and then import
          const m4aFilePath = await convertToM4A(filePath);
          const addedSong = await importSongFromFile(m4aFilePath);
          addedSongs.push(addedSong);
        }
      }

      res.status(201).json(addedSongs);
    } catch (error) {
      console.error('Error while adding songs:', error);

      // If an error occurs, remove all uploaded files
      for (const file of req.files) {
        await fs.unlink(file.path);
      }

      console.error(error);
      res.status(500).json({ message: "Erreur lors de l'ajout des chansons." });
    }
  });
};

exports.getSongFile = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    console.log('Sending file:', song.audio);
    res.sendFile(song.audio, {root: __dirname});
  } catch (error) {
    res.status(500).json({message: 'Error: ' + error.message});
  }
};

exports.getSongCover = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    console.log('Sending file:', song.albumCover);
    res.sendFile(song.albumCover, {root: __dirname});
  } catch (error) {
    res.status(500).json({message: 'Error: ' + error.message});
  }
};

exports.getSongCoverPath = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    res.json({path: song.albumCover});
  } catch (error) {
    res.status(500).json({message: 'Error: ' + error.message});
  }
};

// GET: Récupérer tous les sons
exports.getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find()
      .populate({
        path: 'artist',
        select: 'name',
      })
      .populate({
        path: 'album',
        select: 'title',
      });
    res.json(songs);
  } catch (error) {
    console.error('Erreur lors de la récupération des songs :', error);
    res
      .status(500)
      .json({message: 'Erreur lors de la récupération des songs.'});
  }
};

exports.filterSongs = async (req, res) => {
  try {
    // Extract filter parameters from query
    const {artistId, genreId} = req.query;

    // Construct the filter object based on provided parameters
    const filter = {};
    if (artistId) filter.artist = artistId;
    if (genreId) filter.genre = genreId;

    // Fetch songs based on the filter
    const songs = await Song.find(filter);

    res.json(songs);
  } catch (error) {
    res.status(500).json({message: 'Error: ' + error.message});
  }
};

// GET: Récupérer un son par son ID
exports.getSongById = (req, res) => {
  Song.findById(req.params.id)
    .then(song => res.json(song))
    .catch(err => res.status(400).json('Error: ' + err));
};

// PUT: Mettre à jour un son par son ID
exports.editSong = (req, res) => {
  Song.findById(req.params.id)
    .then(song => {
      song.title = req.body.title;
      // Mettez à jour d'autres champs au besoin
      song
        .save()
        .then(() => res.json(song))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
};

// DELETE: Supprimer un son par son ID
exports.deleteSong = async (req, res) => {
  try {
    // Find the song to get its file path
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Delete the associated file
    await fs.unlink(song.audio);

    // Delete the song from the database
    await Song.findByIdAndDelete(req.params.id);

    res.json({ message: 'Song deleted successfully: ', deletedSongTitle: song.title });
  } catch (err) {
    console.error('Error deleting song:', err);
    res.status(500).json({ message: 'Error deleting song', error: err.message });
  }
};
