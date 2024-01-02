const fs = require('fs').promises;

const Artist = require('../models/artist.model');
const Album = require('../models/album.model');
const Song = require('../models/song.model');

const {createArtistFromFile} = require('../utils/fileCreator');

exports.addArtistFromFile = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const filePath = req.body.filePath;

    console.log('Creating artist from folder:', filePath);
    const artistId = await createArtistFromFile(filePath);

    if (artistId) {
      return res.status(200).json({message: 'Artist already exists', artistId});
    }

    return res
      .status(200)
      .json({message: 'Artist created from folder successfully', artistId});
  } catch (error) {
    console.error('Error creating artist from folder:', error.message);
    return res.status(500).json({error: 'Internal server error'});
  }
};

// GET: Récupérer tous les sons
exports.getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find()
      .populate({
        path: 'songs',
        select: 'title',
      })
      .populate({
        path: 'albums',
        select: 'title',
      });
    res.json(artists);
  } catch (error) {
    console.error('Erreur lors de la récupération des artists :', error);
    res
      .status(500)
      .json({message: 'Erreur lors de la récupération des artists.'});
  }
};

// GET: Récupérer un son par son ID
exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate({
        path: 'albums',
        select: 'title',
      })
      .populate({
        path: 'songs',
        select: 'title',
      });

    res.json(artist);
  } catch (error) {
    console.error('Error retrieving artist by ID:', error);
    res.status(500).json({ message: 'Error retrieving artist by ID.' });
  }
};

// POST: Ajouter un nouveau son
exports.addArtist = (req, res) => {
  const artist = new Artist({
    name: req.body.name,
  });
  artist
    .save()
    .then(() => res.json('Artist added!'))
    .catch(err => res.status(400).json('Error: ' + err));
};

// PUT: Mettre à jour un son par son ID
exports.editArtist = (req, res) => {
  Artist.findById(req.params.id)
    .then(artists => {
      artists.name = req.body.name;
      // Mettez à jour d'autres champs au besoin
      artists
        .save()
        .then(() => res.json('Artist updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
    })
    .catch(err => res.status(400).json('Error: ' + err));
};

// DELETE: Supprimer un son par son ID
exports.deleteArtist = async (req, res) => {
  try {
    // Find and store the artist to get the linked albums
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({message: 'Artist not found.'});
    }

    // Store the linked albums and songs
    const linkedAlbums = artist.albums;

    // Delete the linked albums and their songs
    if (linkedAlbums && linkedAlbums.length > 0) {
      // Find and store the linked songs of each album
      const linkedSongs = await Song.find({ album: { $in: linkedAlbums } });

      if (linkedSongs && linkedSongs.length > 0) {
        for (const song of linkedSongs) {
          // Delete the audio file
          await fs.unlink(song.audio);
        }
        await Song.deleteMany({ _id: { $in: linkedSongs.map(song => song._id) } });
      }

      // Delete the linked albums and their covers
      const albumsToDelete = await Album.find({ _id: { $in: linkedAlbums } });
      for (const album of albumsToDelete) {
        // Delete the album cover
        if (album.albumCover) {
          await fs.unlink(album.albumCover);
        }
      }
      await Album.deleteMany({ _id: { $in: linkedAlbums } });
    }
    
    // Delete the artist from the database
    const deletedArtist = await Artist.findByIdAndDelete(req.params.id);
    console.log('Artist deleted succesfully:', deletedArtist);
    res.json(deletedArtist);
  } catch (error) {
    console.error('Error while deleting an artist:', error);
    res.status(500).json({message: 'Error while deleting an artist.'});
  }
};
