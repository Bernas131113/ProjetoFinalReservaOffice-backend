// logger.js
const pino = require('pino');
const {Writable} = require('stream');
const db = require('./config/db'); 

const dbStream = new Writable({
    write(chunk, encoding, callback) {
        (async () => {

        try{
            
            const logEntry = JSON.parse(chunk.toString());
            // Simulate database write (replace with actual DB logic)
                console.log('Writing to database:', logEntry);
                if (!['request completed', 'request errored'].includes(logEntry.msg)) {
                    return; // Skip non-relevant logs
                }
                connection = await db.getConnection();

                // 1. INICIAR TRANSAÇÃO
                await connection.beginTransaction();
                const { pid, time, req, statusCode, userId, msg } = logEntry;
                console.log(`DB Log - PID: ${pid}, Time: ${time}, Method: ${req.method}, URL: ${req.url}, Status Code: ${statusCode}, User ID: ${userId}, Message: ${msg}`);
                console.log([pid, time, req.method, req.url, statusCode, userId, msg, req.id]);
                const query = await connection.execute('INSERT INTO auditLog (pid, currentdate, method, url, resStatusCode, userID, msg, trackingID) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [pid, time, req.method, req.url, statusCode, userId ? userId : 'Anonimo', msg, req.id]);
                
                await connection.commit();
            } catch (err) {
                console.error('Error writing to database:', err);
            } finally {
                callback();
            }
        })();
    }
});

// Set up the logger
const logger = pino({
    level: 'info', // Default log level
    /*transport: {
        targets: [
            {
                target: "pino-pretty",
                options: { colorize: true },
            },
            {
                target: "pino/file",
                options: { destination: "logs/app.log" },
            },
        ],
    },*/
},
    pino.multistream([
        { stream: process.stdout },
        { stream: pino.transport(
            { target: "pino/file", 
                target: "pino-pretty",
                options: { colorize: true },
            })},
        { stream: pino.transport(
            {
                target: "pino/file",
                options: { destination: "logs/app.log" },
            },) },
        { stream: dbStream },
    ]))
;



module.exports = logger;