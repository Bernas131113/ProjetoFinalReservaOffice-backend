const db = require('../config/db'); 

exports.createBooking = async (req, res) => {

    const { resource_id, start_time, end_time } = req.body;

  
    const user_id = req.user.id; 


    if (!resource_id || !start_time || !end_time) {
        return res.status(400).json({ message: "Por favor, forneça o recurso, a data/hora de início e de fim." });
    }

    try {

        const [result] = await db.execute(
            'INSERT INTO bookings (user_id, resource_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
            [user_id, resource_id, start_time, end_time, 'confirmed']
        );

        return res.status(201).json({ 
            message: "Reserva efetuada com sucesso!", 
            booking_id: result.insertId 
        });

    } catch (error) {
        console.error("Erro ao criar reserva:", error);
        return res.status(500).json({ message: "Erro interno ao processar a reserva." });
    }
};

exports.createBooking = async (req, res) => {

    const { resource_id, start_time, end_time } = req.body;
    const user_id = req.user.id; 


    if (!resource_id || !start_time || !end_time) {
        return res.status(400).json({ message: "Por favor, forneça o recurso, a data/hora de início e de fim." });
    }

    try {

        const queryVerificacao = `
            SELECT id FROM bookings 
            WHERE resource_id = ? 
            AND status = 'confirmed'
            AND start_time < ? 
            AND end_time > ?
        `;
        
        
        const [reservasConflituosas] = await db.execute(queryVerificacao, [resource_id, end_time, start_time]);

      
        if (reservasConflituosas.length > 0) {
            return res.status(400).json({ 
                message: "Lamentamos, mas este recurso já se encontra reservado para o horário selecionado." 
            });
        }
   
        const [result] = await db.execute(
            'INSERT INTO bookings (user_id, resource_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
            [user_id, resource_id, start_time, end_time, 'confirmed']
        );

      
        return res.status(201).json({ 
            message: "Reserva efetuada com sucesso!", 
            booking_id: result.insertId 
        });

    } catch (error) {
        console.error("Erro ao criar reserva:", error);
        return res.status(500).json({ message: "Erro interno ao processar a reserva." });
    }
};

exports.getUserBookings = async (req, res) => {
  
    const user_id = req.user.id; 

    try {
        const query = `
            SELECT 
                b.id AS booking_id, 
                b.start_time, 
                b.end_time, 
                b.status, 
                r.name AS resource_name, 
                r.type AS resource_type
            FROM bookings b
            JOIN resources r ON b.resource_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.start_time DESC
        `;
        
        const [bookings] = await db.execute(query, [user_id]);

       
        return res.status(200).json(bookings);

    } catch (error) {
        console.error("Erro ao procurar reservas:", error);
        return res.status(500).json({ message: "Erro interno ao procurar reservas." });
    }
};

exports.cancelBooking = async (req, res) => {
   
    const booking_id = req.params.id;
    const user_id = req.user.id;

    try {
        const [bookings] = await db.execute(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?', 
            [booking_id, user_id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ message: "Reserva não encontrada ou não tens permissão para a cancelar." });
        }

        const reserva = bookings[0];

        if (reserva.status === 'cancelled') {
            return res.status(400).json({ message: "Esta reserva já se encontra cancelada." });
        }

        await db.execute(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [booking_id]
        );

        return res.status(200).json({ message: "Reserva cancelada com sucesso!" });

    } catch (error) {
        console.error("Erro ao cancelar reserva:", error);
        return res.status(500).json({ message: "Erro interno ao cancelar a reserva." });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const query = `
            SELECT 
                b.id AS booking_id, 
                b.start_time, 
                b.end_time, 
                b.status, 
                u.name AS user_name,
                u.email AS user_email,
                r.name AS resource_name, 
                r.type AS resource_type
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN resources r ON b.resource_id = r.id
            ORDER BY b.start_time DESC
        `;
        
        const [bookings] = await db.execute(query);

        // Devolvemos a lista completa ao Administrador
        return res.status(200).json(bookings);

    } catch (error) {
        console.error("Erro ao procurar todas as reservas:", error);
        return res.status(500).json({ message: "Erro interno ao procurar reservas." });
    }
};