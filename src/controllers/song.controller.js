const fs = require('fs').promises;
const Song = require('../models/song.model');
const upload = require('../middleware/multer');
const {importSongFromFile} = require('../utils/fileCreator');

/* exports.addSong = async (req, res, next) => {
  upload(req, res, async err => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({message: 'Error during file upload.'});
    }
    try {
      console.log('Received a request to add a song:', req.body);

      // Use the importSongFromFile function to handle the song import
      const addedSong = await importSongFromFile(req.file.path);

      res.status(201).json(addedSong);
    } catch (error) {
      console.error('Error while adding a song:', error);
      await fs.unlink(req.file.path);
      console.error(error);
      res.status(500).json({message: "Erreur lors de l'ajout de la chanson."});
    }
  });
}; */

exports.addSong = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ message: 'Error during file upload.' });
    }
    try {
      console.log('Received a request to add songs:', req.files);

      if (req.files.length > 10) {
        // If more than 10 files are uploaded, handle the error
        return res.status(400).json({ message: 'Exceeded maximum number of allowed files (10).' });
      }

      const addedSongs = [];

      // Loop through each file and process it
      for (const file of req.files) {
        const filePath = file.path;

        // Use the importSongFromFile function to handle the song import
        const addedSong = await importSongFromFile(filePath);
        addedSongs.push(addedSong);
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
      song.artist = req.body.artist;
      song.genre = req.body.genre;
      // Mettez à jour d'autres champs au besoin
      song
        .save()
        .then(() => res.json('Song updated!'))
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
