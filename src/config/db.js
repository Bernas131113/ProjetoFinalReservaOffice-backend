const mysql = require('mysql2/promise');
require('dotenv').config();

// Cria o pool de conexões com a base de dados
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testar a ligação para garantir que está tudo bem quando o servidor arranca
pool.getConnection()
    .then(connection => {
        console.log('Ligação à base de dados MySQL com sucesso');
        connection.release(); // Liberta a conexão de volta para o pool
    })
    .catch(err => {
        console.error('Erro ao ligar à base de dados:', err.message);
    });

module.exports = pool;