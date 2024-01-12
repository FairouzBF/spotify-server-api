const Album = require('../models/album.model');
const Artist = require('../models/artist.model');
const Song = require('../models/song.model');
const mm = require('music-metadata');
const fs = require('fs').promises;
const path = require('path');
const Ffmpeg = require('fluent-ffmpeg'); 

async function convertToWav(filePath) {
    return new Promise((resolve, reject) => {
      const outputFilePath = `${filePath}.wav`;
  
      Ffmpeg(filePath)
        .audioCodec('pcm_s16le')
        .toFormat('wav')
        .on('end', () => resolve(outputFilePath))
        .on('error', reject)
        .save(outputFilePath);
    });
  }
  
  function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach((file) => {
      const dirFile = path.join(dir, file);
      try {
        filelist = fs.statSync(dirFile).isDirectory()
          ? walkSync(dirFile, filelist)
          : filelist.concat(dirFile);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.error('Skipping:', dirFile, ' - Broken symlink');
        } else throw err;
      }
    });
    return filelist;
  }

async function importSongFromFile(filePath) {
    try {
      const wavFilePath = await convertToWav(filePath);
  
      const metadata = await mm.parseFile(filePath);
      console.log('Reading metadata...', metadata.common);
  
      const {title, artist, album} = metadata.common;
  
      const existingSong = await Song.findOne({title: title});
  
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
        title,
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
      fs.unlinkSync(wavFilePath);
      return { message: 'Song added successfully', songId: savedSong._id, artistId: existingArtist._id, albumId: existingAlbum._id };
    } catch (error) {
      console.error(`Error creating album from file ${filePath}:`, error.message);
      throw error;
    }
  }

  //New Function
async function importSongFromFile(filePath) {
  try {
    const wavFilePath = await convertToWav(filePath);

    const metadata = await mm.parseFile(filePath);
    console.log('Reading metadata...', metadata.common);

    const {title, artist, album} = metadata.common;

    const existingSong = await Song.findOne({title: title});

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
      title,
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
    fs.unlinkSync(wavFilePath);
    return { message: 'Song added successfully', songId: savedSong._id, artistId: existingArtist._id, albumId: existingAlbum._id };
  } catch (error) {
    console.error(`Error creating album from file ${filePath}:`, error.message);
    throw error;
  }
}

  async function processAudioFile(filePath) {
    try {
      const wavFilePath = await convertToWav(filePath);
  
      const metadata = await mm.parseFile(wavFilePath);
      const { title } = metadata.common;
  
      const existingSong = await Song.findOne({ title });
      if (existingSong) {
        console.error('Song already exists:', existingSong);
        return { message: 'Song already exists', existingSongId: existingSong._id };
      }
  
      // Rest of your processing logic for the audio file
      // ...
  
      // Clean up the temporary WAV file
      fs.unlinkSync(wavFilePath);
    } catch (error) {
      console.error('Error processing file:', filePath, error);
    }
  }

  async function uploadAudioFilesFromDirectory(directoryPath) {
    try {
      const audioFiles = walkSync(directoryPath).filter((file) =>
        file.match(/\.(mp3|wav|flac)$/i)
      );
  
      for (const file of audioFiles) {
        await processAudioFile(file);
      }
  
      console.log('Finished processing audio files');
    } catch (error) {
      console.error('Error uploading audio files:', error);
    }
  }

const musicDirectory = '../../Music'

uploadAudioFilesFromDirectory(musicDirectory);
