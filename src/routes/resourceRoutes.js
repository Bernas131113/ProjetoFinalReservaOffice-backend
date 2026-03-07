const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

/**
 * @swagger
 * /api/resources:
 *   get:
 *    summary: Retorna a lista de todos os recursos (mesas, monitores, salas)
 *    tags: [Resources]
 *    responses:
 *       200:
 *          description: Lista de recursos obtida com sucesso.
 */


router.get('/', resourceController.getAllResources);

module.exports = router;