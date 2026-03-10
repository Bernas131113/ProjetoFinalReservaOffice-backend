const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');


/**
 * Autentica um utilizador e gera um Token de Sessão (JWT).
 * Valida as credenciais inseridas comparando-as com as da base de dados.
 * Se forem válidas, assina um token que contém o ID e o Role (cargo) do utilizador.
 * * @param {Object} req - Pedido HTTP que contém email e password.
 * @param {Object} res - Resposta HTTP que contém a mensagem de sucesso e o Token.
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }

        const user = users[0];
        const passwordValida = await bcrypt.compare(password, user.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }

        const secret = process.env.JWT_SECRET || 'chave_super_secreta_provisoria';
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            secret, 
            { expiresIn: '2h' } 
        );

        return res.json({ 
            message: "Login com sucesso!", 
            token: token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
};

/**
 * Regista um novo utilizador no sistema.
 * Recebe os dados do utilizador, verifica se o email já está em uso,
 * e guarda o novo registo na base de dados (idealmente com a password encriptada).
 * * @param {Object} req - Pedido HTTP que contém nome, email e password no body.
 * @param {Object} res - Resposta HTTP.
 */
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Por favor, preencha todos os campos." });
    }

    try {
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Este email já se encontra registado." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const role = "user";

        const [result] = await db.execute(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        return res.status(201).json({ 
            message: "Utilizador criado com sucesso!", 
            userId: result.insertId 
        });

    } catch (error) {
        console.error("Erro no registo:", error);
        return res.status(500).json({ message: "Erro interno ao criar utilizador." });
    }
};