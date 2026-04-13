const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController'); 
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');


router.use(authMiddleware);
router.use(adminMiddleware);


router.get('/users', authController.getAllUsers);
router.put('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

module.exports = router;