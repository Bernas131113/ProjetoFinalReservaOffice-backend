/**
 * Middleware de Autorização para Administradores.
 * Garante que apenas utilizadores com o cargo (role) de 'admin' podem aceder à rota.
 * * IMPORTANTE: Este middleware deve ser usado SEMPRE depois do middleware de 
 * autenticação (auth.js), pois precisa que o objeto `req.user` já tenha sido criado.
 */
module.exports = (req, res, next) => {
    
    // 1. Prevenção: Garante que o utilizador passou pela verificação de Token
    if (!req.user) {
        return res.status(401).json({ message: "Acesso negado. Utilizador não autenticado." });
    }

    // 2. Verifica o nível de permissões (role) do utilizador
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: "Acesso negado. Apenas administradores podem realizar esta ação." 
        });
    }

    // 3. O utilizador é Admin. Permite que o pedido avance
    next();
};