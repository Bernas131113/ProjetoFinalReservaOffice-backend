const mysql = require('mysql2/promise'); // Usamos a versão com promises para permitir async/await
require('dotenv').config();

/**
 * Configuração do Pool de Ligações ao MySQL.
 * O Pool gere múltiplas ligações simultâneas, reutilizando-as para maior performance
 * em vez de abrir e fechar uma nova ligação a cada pedido.
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
    waitForConnections: true,
    connectionLimit: 10, // Máximo de 10 ligações em simultâneo
    queueLimit: 0
});

// Testar a ligação quando o servidor arranca
pool.getConnection()
    .then(connection => {
        console.log('Ligação à base de dados MySQL (Aiven) com sucesso!');
        connection.release();
    })
    .catch(err => {
        console.error('Erro ao ligar à base de dados:', err.message);
    });

module.exports = pool;