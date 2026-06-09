const express = require('express');
const router = express.Router();
const officeController = require('../controllers/officeController');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// Listar todos os escritórios (Utilizadores Autenticados)
router.get('/', authMiddleware, officeController.getAllOffices);

// Criar escritório (Apenas Admin)
router.post('/', authMiddleware, adminMiddleware, officeController.createOffice);

// Atualizar escritório (Apenas Admin)
router.put('/:id', authMiddleware, adminMiddleware, officeController.updateOffice);

// Desativar escritório (Apenas Admin)
router.delete('/:id', authMiddleware, adminMiddleware, officeController.deleteOffice);

module.exports = router;
