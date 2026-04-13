const db = require('../config/db');

// 1. Listar TODOS os recursos (Para Admin e visualização geral)
exports.getAllResources = async (req, res) => {
    try {
        const [resources] = await db.query('SELECT * FROM resources');
        res.status(200).json(resources);
    } catch (error) {
        console.error('Erro ao listar recursos:', error);
        res.status(500).json({ message: 'Erro ao obter recursos.' });
    }
};

// 2. Listar APENAS recursos disponíveis (Ativos)
exports.getAvailableResources = async (req, res) => {
    try {
        const [resources] = await db.query("SELECT * FROM resources WHERE status = 'active'");
        res.status(200).json(resources);
    } catch (error) {
        console.error('Erro ao listar recursos disponíveis:', error);
        res.status(500).json({ message: 'Erro ao obter recursos disponíveis.' });
    }
};

// --- FUNÇÕES DE ADMINISTRAÇÃO DE RECURSOS ---

// 3. Criar uma nova mesa ou sala (Admin)
exports.createResource = async (req, res) => {
    const { name, type, floor, status } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO resources (name, type, floor, status) VALUES (?, ?, ?, ?)',
            [name, type, floor, status || 'active']
        );
        res.status(201).json({ message: 'Recurso criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao criar recurso:', error);
        res.status(500).json({ message: 'Erro ao criar recurso.' });
    }
};

// 4. Atualizar uma mesa ou sala (Admin)
exports.updateResource = async (req, res) => {
    const { id } = req.params;
    const { name, type, floor, status } = req.body;
    try {
        // Verifica se existe primeiro
        const [resourceExists] = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
        if (resourceExists.length === 0) {
            return res.status(404).json({ message: 'Recurso não encontrado.' });
        }

        await db.query(
            'UPDATE resources SET name = ?, type = ?, floor = ?, status = ? WHERE id = ?',
            [name, type, floor, status, id]
        );
        res.json({ message: 'Recurso atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar recurso:', error);
        res.status(500).json({ message: 'Erro ao atualizar recurso.' });
    }
};

// 5. Remover uma mesa ou sala (Admin)
exports.deleteResource = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM resources WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Recurso não encontrado.' });
        }
        res.json({ message: 'Recurso eliminado com sucesso!' });
    } catch (error) {
        console.error('Erro ao eliminar recurso:', error);
        res.status(500).json({ message: 'Erro ao eliminar recurso.' });
    }
};