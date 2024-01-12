const fs = require('fs').promises;
const {editCover} = require('../utils/fileCreator');
const Album = require('../models/album.model');
const Artist = require('../models/artist.model');
const Song = require('../models/song.model');

const {createAlbumFromFile} = require('../utils/fileCreator');

exports.addAlbumFromFile = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const file = req.body;
    const albumId = await createAlbumFromFile(file);

    return res
      .status(200)
      .json({message: 'Artist created from file successfully', albumId});
  } catch (error) {
    console.error('Error creating album from file:', error.message);
    return res.status(500).json({error: 'Internal server error'});
  }
};

// CREATE (ajouter un album)
exports.addAlbum = async (req, res) => {
  try {
    const {title, artist, releaseDate} = req.body;

    let existingArtist = await Artist.findOne({name: artist});

    // Si l'artiste n'existe pas, créez un nouvel artiste
    if (!existingArtist) {
      existingArtist = new Artist({name: artist});
      await existingArtist.save();
    }

    // Créez un nouvel objet Album avec les données fournies
    const newAlbum = new Album({
      title,
      artist: existingArtist,
      releaseDate,
    });

    // Enregistrez l'album dans la base de données
    const savedAlbum = await newAlbum.save();
    existingArtist.albums.push(savedAlbum._id);
    await existingArtist.save();

    res.status(201).json(savedAlbum);
  } catch (error) {
    res.status(500).json({message: "Erreur lors de l'ajout d'un album."});
  }
};

// READ (obtenir tous les albums)
exports.getAllAlbums = async (req, res) => {
  try {
    const albums = await Album.find()
      .populate({
        path: 'songs',
        select: 'title',
      })
      .populate({
        path: 'artist',
        select: 'name',
      });
    res.json(albums);
  } catch (error) {
    console.error('Erreur lors de la récupération des albums :', error);
    res
      .status(500)
      .json({message: 'Erreur lors de la récupération des albums.'});
  }
};

// READ (obtenir un album par son ID)
exports.getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate('artist')
      .populate('songs');
    res.json(album);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'album :", error);
    res
      .status(500)
      .json({message: "Erreur lors de la récupération de l'album."});
  }
};

// UPDATE (modifier un album)
exports.editAlbum = async (req, res) => {
  try {
    console.log('Album ID:', req.params.id);
    const { title, releaseDate } = req.body;
    console.log('Request body:', req.body);
    const updatedAlbum = await Album.findById(req.params.id);

    if (!title && releaseDate === undefined && !req.file) {
      return res.status(400).json({message: 'No data provided'});
    }
    if (!updatedAlbum) {
      return res.status(404).json({message: 'Album not found'});
    }

    const oldAlbumCoverPath = updatedAlbum.albumCover;

    updatedAlbum.title = title || updatedAlbum.title;
    updatedAlbum.releaseDate = releaseDate !== undefined ? new Date(releaseDate) : updatedAlbum.releaseDate;
    
    if (req.file) {
      updatedAlbum.albumCover = await editCover(req.file);
      if (oldAlbumCoverPath) {
        await fs.unlink(oldAlbumCoverPath);
      }
    }
    const savedAlbum = await updatedAlbum.save();

    res.json(savedAlbum);
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un album :", error);
    res
      .status(500)
      .json({message: "Erreur lors de la mise à jour d'un album."});
  }
};

// DELETE (supprimer un album)
exports.deleteAlbum = async (req, res) => {
  try {
    // Find and store the album to get the linked songs
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({message: 'Album not found.'});
    }

    // Store the linked songs
    const linkedSongs = album.songs;
    const albumCover = album.albumCover;

    // Delete the linked songs
    if (linkedSongs && linkedSongs.length > 0) {
      // Delete the associated files for each linked song
      const songsToDelete = await Song.find({_id: {$in: linkedSongs}});
      for (const song of songsToDelete) {
        await fs.unlink(song.audio);
      }

      await Song.deleteMany({_id: {$in: linkedSongs}});
    }
    // Delete the album cover
    if (albumCover) {
      await fs.unlink(albumCover);
    }

    // Delete the album from the database
    const deletedAlbum = await Album.findByIdAndDelete(req.params.id);
    console.log('Album deleted succesfully:', deletedAlbum);

    res.json(deletedAlbum);
  } catch (error) {
    console.error("Erreur lors de la suppression d'un album :", error);
    res
      .status(500)
      .json({message: "Erreur lors de la suppression d'un album."});
  }
};

exports.getAlbumCover = async (req, res) => {
  try {
    console.log('GET /api/albums/cover called with albumId:', req.params.id);
    const albumId = req.params.id;

    // Find the album by ID
    const album = await Album.findById(albumId);

    if (!album) {
      return res.status(404).json({error: 'Album not found'});
    }

    // Check if the album has a cover
    if (!album.albumCover) {
      return res.status(404).json({error: 'Album cover not found'});
    }

    // Send the album cover as a data URI
    res.status(200).send(album.albumCover);
  } catch (error) {
    console.error('Error retrieving album cover:', error);
    res.status(500).json({error: 'Internal server error'});
  }
};
