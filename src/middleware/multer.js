const multer = require('multer');
const path = require('path');

// Configuration de Multer pour gérer les fichiers m4a
const songStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

//const upload = multer({ storage: storage }).single('audio');
const songUpload = multer({storage: songStorage}).array('audio', 10000); //CHANGED TO 1000

const coverStorage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const coverUpload = multer({storage: coverStorage, fileFilter}).single('albumCover');

module.exports = {songUpload, coverUpload};
