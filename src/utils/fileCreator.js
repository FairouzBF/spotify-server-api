const Album = require('../models/album.model');
const Artist = require('../models/artist.model');
const Song = require('../models/song.model');
const mm = require('music-metadata');
const fs = require('fs').promises;
const path = require('path');

async function saveImage(picture) {
  if (!picture) {
    // If picture is undefined, use a default image path
    console.log('No picture provided, using default image...');
    const defaultImagePath = path.join('src', 'assets', 'unknown.jpeg');

    const newFileName = `${Date.now()}.jpeg`;
    const newImagePath = path.join('covers', newFileName);

    try {
      // Copy the default image to a new file with the current date in the name
      await fs.copyFile(defaultImagePath, newImagePath);
      console.log('Default image copied successfully:', newImagePath);
      return newImagePath;
    } catch (error) {
      console.error('Error copying default image:', error.message);
      throw error;
    }
  }

  console.log('Saving cover...');
  const extension = picture[0].format.split('/')[1];
  const fileName = `${Date.now()}.${extension}`;
  const relativePath = path.join('covers', fileName);
  const imagePath = path.join(process.cwd(),  relativePath);
  await fs.writeFile(imagePath, picture[0].data);
  console.log('Cover saved successfully:', relativePath);
  
  return relativePath;
}

async function editCover(picture) {
  const fileExtension = path.extname(picture.originalname);
  const fileName = `${Date.now()}${fileExtension}`;
  const relativePath = path.join('covers', fileName);
  const imagePath = path.join(process.cwd(),  relativePath);
  await fs.writeFile(imagePath, picture.buffer);
  console.log('Cover edited successfully:', relativePath);
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return normalizedPath;
}

async function createArtistFromFile(file) {
  try {
      const metadata = await mm.parseFile(file);
      console.log('Metadata:', metadata);

      const artistName = metadata.common.artist || 'Unknown artist';
      const existingArtist = await Artist.findOne({ name: artistName });

      if (existingArtist) {
          console.error('Artist already exists:', existingArtist);
          return existingArtist._id;
      }

      const artist = new Artist({
          name: metadata.common.artist,
          albums: [],
          songs: [],
      });

      await artist.save();
      console.log('Artist created successfully from folder:', artist);

      return artist._id;
  } catch (error) {
      console.error(`Error creating artist from folder ${file}:`, error.message);
      throw error;
  }
}

async function createAlbumFromFile(filePath) {
  try {
    const metadata = await mm.parseFile(filePath);
    const albumTitle = metadata.common.album || 'Unknown album';
    const existingAlbum = await Album.findOne({title: albumTitle});

    if (existingAlbum) {
      console.error('Album already exists:', existingAlbum);
      return existingAlbum._id;
    }

    console.log(
      `Album ${albumTitle} does not exist, adding it to the DB...`,
    );
    
    console.log('Checking for artist...');
    let existingArtist = await Artist.findOne({name: metadata.common.artist});

    if (!existingArtist) {
      console.log(
        `Artist ${metadata.common.artist} does not exist, adding them to the DB...`,
      );
      const newArtist = new Artist({
        name: metadata.common.artist || 'Unknown artist',
      });

      existingArtist = await newArtist.save();
      console.log('Artist created successfully!');
    }

    console.log('Adding the album to the DB...');
    const albumCoverPath = await saveImage(metadata.common.picture);
    console.log("<!>ALBUM COVER PATH :<!>", albumCoverPath, metadata.common.picture);
    const urlFriendlyAlbumCoverPath = albumCoverPath ? albumCoverPath.replace(/\\/g, '/') : null;
    const album = new Album({
      title: albumTitle,
      artist: existingArtist._id,
      releaseDate: metadata.common.year,
      songs: [],
      albumCover: urlFriendlyAlbumCoverPath,
    });

    await album.save();
    console.log('Album created successfully!');

    existingArtist.albums.push(album._id);
    await existingArtist.save();
    console.log('Album linked to artist successfully!');

    return album._id;
  } catch (error) {
    console.error(`Error creating album from file ${filePath} - creating album from file:`, error.message);
    throw error;
  }
}

async function importSongFromFile(filePath) {
  try {
    const metadata = await mm.parseFile(filePath);
    console.log('Reading metadata...', metadata);

    const {title, artist, album} = metadata.common;
    const songTitle = title || path.basename(filePath, path.extname(filePath));

    const existingSong = await Song.findOne({title: songTitle});

    if (existingSong) {
      console.error('Song already exists:', existingSong);
      return { message: 'Song already exists', existingSongId: existingSong._id };
    }

    console.log('Checking for album...');
    let existingAlbum = await Album.findOne({title: album});

    if (!existingAlbum) {
      const albumId = await createAlbumFromFile(filePath);
      existingAlbum = await Album.findById(albumId);
    }

    // If the artist didn't exist before this, it's already been created with the createAlbumFromFile function
    let existingArtist = await Artist.findOne({name: artist});

    if (!existingArtist) {
      const artistId = await createArtistFromFile(filePath);
      existingArtist = await Artist.findById(artistId);
    }

    const urlFriendlyAudioPath = filePath.replace(/\\/g, '/');
    const newSong = new Song({
      title: songTitle,
      artist: existingArtist._id,
      album: existingAlbum._id,
      albumCover: existingAlbum.albumCover,
      audio: urlFriendlyAudioPath,
      duration: metadata.format.duration,
    });

    const savedSong = await newSong.save();

    existingAlbum.songs.push(savedSong._id);
    await existingAlbum.save();
    console.log('Song linked to album successfully!');
    existingArtist.songs.push(savedSong._id);
    await existingArtist.save();
    console.log('Song linked to artist successfully!');
    return { message: 'Song added successfully', songId: savedSong._id, artistId: existingArtist._id, albumId: existingAlbum._id };
  } catch (error) {
    console.error(`Error creating album from file ${filePath} - importing song:`, error.message);
    throw error;
  }
}

module.exports = {
  createAlbumFromFile, importSongFromFile, createArtistFromFile, saveImage, editCover,
};
