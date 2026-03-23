const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ message: 'Credenciais inválidas.' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ message: 'Credenciais inválidas.' });


        const accessToken = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' }
        );

       
        const refreshToken = jwt.sign(
            { id: user.id }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: '7d' }
        );

        await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

       
        res.json({
            message: 'Login com sucesso',
            accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};
exports.refreshToken = async (req, res) => {
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh Token é obrigatório.' });
    }

    try {
    
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  
        const [users] = await db.query('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [decoded.id, refreshToken]);
        
        if (users.length === 0) {
            return res.status(403).json({ message: 'Refresh Token inválido ou revogado. Faz login novamente.' });
        }

  
        const newAccessToken = jwt.sign(
            { id: users[0].id, role: users[0].role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' }
        );

        res.json({ accessToken: newAccessToken });

    } catch (error) {
        console.error('Erro no refresh token:', error);
        res.status(403).json({ message: 'Refresh Token expirado ou inválido. Faz login novamente.' });
    }
};

exports.logout = async (req, res) => {
    const { id } = req.user; 
    try {
        await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [id]);
        res.json({ message: 'Sessão terminada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao terminar sessão.' });
    }
};

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