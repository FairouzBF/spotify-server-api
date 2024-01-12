const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const authMiddleware = require('../middleware/authMiddleware');
const { coverUpload } = require('../middleware/multer'); 

router.get('/cover/:id', albumController.getAlbumCover);
router.get('/', albumController.getAllAlbums);
router.get('/:id', albumController.getAlbumById);
router.post('/', authMiddleware, albumController.addAlbum);
router.post('/file', authMiddleware, albumController.addAlbumFromFile);
router.put('/:id', authMiddleware, coverUpload, albumController.editAlbum);
router.delete('/:id', authMiddleware, albumController.deleteAlbum);

module.exports = router;
