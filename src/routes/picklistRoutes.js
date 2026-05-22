const express = require('express');
const router = express.Router();

// Como estas listas são públicas para o frontend carregar nos forms,
// não precisam obrigatoriamente de proteção pesada, mas podem estar sob o /api
router.get('/', (req, res) => {
    res.json({
        roles: [
            { id: 'user', label: 'Utilizador' },
            { id: 'admin', label: 'Administrador' },
            { id: 'tecnico', label: 'Técnico' }
        ],
        resourceTypes: [
            { id: 'desk', label: 'Mesa' },
            { id: 'room', label: 'Sala' },
            { id: 'monitor', label: 'Monitor' }
        ],
        resourceStatuses: [
            { id: 'active', label: 'Ativo (Livre)' },
            { id: 'maintenance', label: 'Em Manutenção' }
        ]
    });
});

module.exports = router;