const express = require('express');
const router = express.Router();
const songController = require('../controllers/song.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', songController.getAllSongs);
router.get('/filter', songController.filterSongs);
router.get('/song-count', songController.getSongCount);
router.get('/total-listens', songController.getTotalListens);
router.get('/coverPath/:id', songController.getSongCoverPath);
router.get('/cover/:id', songController.getSongCover);
router.get('/file/:id', songController.getSongFile);
router.get('/:id', songController.getSongById);
router.get('/listens/:id', songController.getSongListens);
router.post('/', authMiddleware, songController.addSong);
router.post('/increment-listens/:id', songController.incrementListens);
router.put('/:id', authMiddleware, songController.editSong);
router.delete('/:id', authMiddleware, songController.deleteSong);

module.exports = router;
