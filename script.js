const fs = require('fs').promises;
const mongoose = require('mongoose');
const path = require('path');
const { importSongFromFile } = require('./src/utils/fileCreator');
const {songUpload} = require('./src/middleware/multer');

mongoose
  .connect(
    `mongodb+srv://fairouz:admin@spotify.krhfoqt.mongodb.net/?retryWrites=true&w=majority`,
    {
      serverSelectionTimeoutMS: 50000,
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    }
  );

  const db = mongoose.connection;

  db.on('error', (error) => {
    console.error('Database connection error:', error);
    process.exit(1); // Exit the script if there's a database connection error
  });
  db.once('open', () => {
    console.log('Connected to the database');
  
    // Call your function to upload audio files after the database connection is established
    uploadAudioFilesFromDirectory('../Music');
  });

async function walkSync(dir, filelist = []) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    try {
      const isDirectory = (await fs.stat(dirFile)).isDirectory();
      filelist = isDirectory
        ? await walkSync(dirFile, filelist)
        : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.error('Skipping:', dirFile, ' - Broken symlink');
      } else throw err;
    }
  }
  return filelist;
}

async function uploadAudioFilesFromDirectory(directoryPath) {
  try {
    const audioFiles = await walkSync(directoryPath);
    const validAudioFiles = audioFiles.filter(file =>
      file.match(/\.(mp3|m4a|flac|wav)$/i),
    );

    for (const file of validAudioFiles) {
      console.log('Processing file:', file);
      // Generate a new filename using Date.now()
      const newFileName = Date.now() + path.extname(file);
      // Create the destination path in the './uploads' folder
      const destinationPath = path.join('./uploads', newFileName);

      // Copy the file to the './uploads' folder
      await fs.copyFile(file, destinationPath);

      // Now, use the destination path to import the song
      console.log('Importing song from file:', destinationPath);
      await importSongFromFile(destinationPath);
    }

    console.log('Finished processing audio files');
  } catch (error) {
    console.error('Error uploading audio files:', error);
  }
}