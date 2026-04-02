require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 1. INICIALIZAÇÃO DA BASE DE DADOS
const db = require('./config/db'); 

const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// 2. CONFIGURAÇÃO DE MIDDLEWARES GLOBAIS
const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'https://o-teu-futuro-frontend.vercel.app'], 
    credentials: true 
}));

app.use(express.json());

// 3. DEFINIÇÃO DE ROTAS DA API
const resourceRoutes = require('./routes/resourceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/auth');

app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);

// 4. CONFIGURAÇÃO DO SWAGGER
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Reserva Office API',
            version: '1.0.0',
            description: 'API do MVP para gestão de reservas e recursos.',
            contact: {
                name: 'Equipa de Desenvolvimento',
            }
        },
        servers: [
            {
                url: 'https://projetofinalreservaoffice-backend.vercel.app',
                description: 'Servidor de Produção (Vercel)'
            },
            {
                url: 'http://localhost:5000',
                description: 'Servidor Local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    // ⚠️ CORRIGIDO (sem /src)
    apis: ['./routes/*.js', './server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// FIX Swagger na Vercel
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customCssUrl: CSS_URL,
}));

// 5. ROTAS PROTEGIDAS
const verificarToken = require('./middlewares/auth');
const verificarAdmin = require('./middlewares/admin');

/**
 * @swagger
 * /api/perfil:
 *   get:
 *     summary: Área VIP (Protegida)
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sucesso.
 */
app.get('/api/perfil', verificarToken, (req, res) => {
    res.json({ 
        message: "Bem-vindo à área VIP!", 
        dados_do_utilizador: req.user 
    });
});

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Área Exclusiva de Administração
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bem-vindo Admin.
 */
app.get('/api/admin/dashboard', verificarToken, verificarAdmin, (req, res) => {
    res.json({ 
        message: "Bem-vindo ao Painel de Administração Supremo!", 
        acesso_concedido: true 
    });
});

// ROTA BASE
app.get('/', (req, res) => {
    res.send('API Reserva Office a funcionar na Vercel! 🚀');
});

// 6. INICIALIZAÇÃO DO SERVIDOR
const PORT = process.env.PORT || 5000;

// Local apenas
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor local na porta ${PORT}`);
        console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    });
}

// OBRIGATÓRIO PARA VERCEL
module.exports = app;