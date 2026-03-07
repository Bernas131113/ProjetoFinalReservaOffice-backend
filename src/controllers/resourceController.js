const db = require('../config/db'); // Importar a ligação à base de dados

// Função para ir buscar todos os recursos
exports.getAllResources = async (req, res) => {
    try {
        // O db.execute faz a query SQL. [resources] para extrair logo o array de resultados
        const [resources] = await db.execute('SELECT * FROM resources');
        
        // Devolve os dados ao frontend em formato JSON com o status 200 (OK)
        res.status(200).json(resources);
    } catch (error) {
        console.error('Erro ao buscar recursos:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao procurar recursos.' });
    }
};