require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const db = require('./config/db'); 


const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();

app.use(express.json());
app.use(cors());


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
            { url: 'http://localhost:5000', description: 'Servidor Local' }
        ],
    },
    apis: ['./routes/*.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.get('/', (req, res) => {
    res.send('API Reserva Office a funcionar! 🚀');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
    console.log(`Documentação disponível em: http://localhost:${PORT}/api-docs`);
});