const db = require('../config/db');

// --- LISTAR RECURSOS (Com filtro opcional por piso) ---
exports.getAllResources = async (req, res) => {
    const { floor } = req.query; // Pega o ?floor=1 do URL se existir

    try {
        let query = 'SELECT * FROM resources';
        let params = [];

        if (floor) {
            query += ' WHERE floor = ?';
            params.push(floor);
        }

        const [resources] = await db.query(query, params);
        
        // O MySQL devolve o JSON como string ou objeto dependendo do driver. 
        // Garantimos que o Frontend recebe um objeto JSON real.
        const formattedResources = resources.map(res => ({
            ...res,
            features: typeof res.features === 'string' ? JSON.parse(res.features) : res.features
        }));

        res.json(formattedResources);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao obter recursos.' });
    }
};

// --- CRIAR NOVO RECURSO ---
exports.createResource = async (req, res) => {
    const { name, type, floor, features } = req.body;

    try {
        // Guardamos o objeto features como string JSON no MySQL
        const [result] = await db.query(
            'INSERT INTO resources (name, type, floor, features) VALUES (?, ?, ?, ?)',
            [name, type, floor || 1, JSON.stringify(features || {})]
        );

        res.status(201).json({ 
            message: 'Recurso criado!', 
            resourceId: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar recurso.' });
    }
};

// --- ATUALIZAR RECURSO (Rota de Admin) ---
exports.updateResource = async (req, res) => {
    const { id } = req.params;
    const { name, type, floor, features } = req.body;

    try {
        // Primeiro verificamos se existe
        const [exists] = await db.query('SELECT * FROM resources WHERE id = ?', [id]);
        if (exists.length === 0) return res.status(404).json({ message: 'Recurso não encontrado.' });

        // Atualizamos os campos (se não vierem no body, mantemos os antigos)
        await db.query(
            'UPDATE resources SET name = ?, type = ?, floor = ?, features = ? WHERE id = ?',
            [
                name || exists[0].name,
                type || exists[0].type,
                floor || exists[0].floor,
                features ? JSON.stringify(features) : exists[0].features,
                id
            ]
        );

        res.json({ message: 'Recurso atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar recurso.' });
    }
};