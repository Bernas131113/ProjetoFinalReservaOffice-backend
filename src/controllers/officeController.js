const db = require('../config/db');

// 1. Listar todos os escritórios
exports.getAllOffices = async (req, res) => {
    try {
        const query = `
        SELECT id, name, address,
               TIME_FORMAT(operating_hours_start, '%H:%i') AS operating_hours_start,
               TIME_FORMAT(operating_hours_end, '%H:%i') AS operating_hours_end,
               timezone, active, floors, working_days, created_at
        FROM offices
        ORDER BY name ASC
    `;
        const [offices] = await db.execute(query);
        res.json(offices);
    } catch (error) {
        console.error('Erro ao listar escritórios:', error);
        res.status(500).json({ message: 'Erro ao listar escritórios.' });
    }
};

// 2. Criar novo escritório
exports.createOffice = async (req, res) => {
    const { name, address, operating_hours_start, operating_hours_end, timezone, active, floors, working_days } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'O nome do escritório é obrigatório.' });
    }

    try {
        const [existing] = await db.execute('SELECT id FROM offices WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Já existe um escritório com esse nome.' });
        }

        const [result] = await db.execute(
            'INSERT INTO offices (name, address, operating_hours_start, operating_hours_end, timezone, active, floors, working_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                name,
                address || null,
                operating_hours_start || '09:00',
                operating_hours_end || '18:00',
                timezone || 'Europe/Lisbon',
                active !== undefined ? active : true,
                floors || 1,
                working_days ? JSON.stringify(working_days) : JSON.stringify([2, 3, 4, 5, 6]) // Padrão: Segunda a Sexta
            ]
        );
        res.status(201).json({ message: 'Escritório criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error('Erro ao criar escritório:', error);
        res.status(500).json({ message: 'Erro ao criar escritório.' });
    }
};

// 3. Atualizar escritório
exports.updateOffice = async (req, res) => {
    const { id } = req.params;
    const { name, address, operating_hours_start, operating_hours_end, timezone, active, floors, working_days } = req.body;

    try {
        const [existing] = await db.execute('SELECT * FROM offices WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Escritório não encontrado.' });
        }

        if (name && name !== existing[0].name) {
            const [nameDup] = await db.execute('SELECT id FROM offices WHERE name = ? AND id != ?', [name, id]);
            if (nameDup.length > 0) {
                return res.status(400).json({ message: 'Já existe outro escritório com esse nome.' });
            }
        }

        await db.execute(
            'UPDATE offices SET name = ?, address = ?, operating_hours_start = ?, operating_hours_end = ?, timezone = ?, active = ?, floors = ?, working_days = ? WHERE id = ?',
            [
                name || existing[0].name,
                address !== undefined ? address : existing[0].address,
                operating_hours_start || existing[0].operating_hours_start,
                operating_hours_end || existing[0].operating_hours_end,
                timezone || existing[0].timezone,
                active !== undefined ? active : existing[0].active,
                floors !== undefined ? floors : existing[0].floors,
                working_days ? JSON.stringify(working_days) : (existing[0].working_days ? JSON.stringify(existing[0].working_days) : null),
                id
            ]
        );

        res.json({ message: 'Escritório atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar escritório:', error);
        res.status(500).json({ message: 'Erro ao atualizar escritório.' });
    }
};

// 4. Eliminar fisicamente o escritório da Base de Dados
exports.deleteOffice = async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verificar se o escritório existe
        const [existing] = await connection.execute('SELECT * FROM offices WHERE id = ?', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Escritório não encontrado.' });
        }

        const officeName = existing[0].name;

        // 2. Obter as localizações deste escritório
        const [locations] = await connection.execute('SELECT id FROM locations WHERE office_id = ?', [id]);

        if (locations.length > 0) {
            const locationIds = locations.map(l => l.id);
            const locationPlaceholders = locationIds.map(() => '?').join(',');

            // 3. Obter os recursos destas localizações
            const [resources] = await connection.execute(
                `SELECT id FROM resources WHERE location_id IN (${locationPlaceholders})`,
                locationIds
            );

            if (resources.length > 0) {
                const resourceIds = resources.map(r => r.id);
                const resourcePlaceholders = resourceIds.map(() => '?').join(',');

                // 4. Obter as reservas destes recursos
                const [bookings] = await connection.execute(
                    `SELECT id FROM bookings WHERE resource_id IN (${resourcePlaceholders})`,
                    resourceIds
                );

                if (bookings.length > 0) {
                    const bookingIds = bookings.map(b => b.id);
                    const bookingPlaceholders = bookingIds.map(() => '?').join(',');

                    // A. Apagar convidados das reservas
                    await connection.execute(
                        `DELETE FROM booking_guests WHERE booking_id IN (${bookingPlaceholders})`,
                        bookingIds
                    );

                    // B. Apagar histórico das reservas
                    await connection.execute(
                        `DELETE FROM booking_history WHERE booking_id IN (${bookingPlaceholders})`,
                        bookingIds
                    );

                    // C. Apagar as reservas
                    await connection.execute(
                        `DELETE FROM bookings WHERE resource_id IN (${resourcePlaceholders})`,
                        resourceIds
                    );
                }

                // D. Apagar tickets de suporte associados
                await connection.execute(
                    `DELETE FROM tickets WHERE resource_id IN (${resourcePlaceholders})`,
                    resourceIds
                );

                // E. Apagar os recursos (mesas, salas, etc.)
                await connection.execute(
                    `DELETE FROM resources WHERE location_id IN (${locationPlaceholders})`,
                    locationIds
                );
            }

            // F. Apagar as localizações
            await connection.execute('DELETE FROM locations WHERE office_id = ?', [id]);
        }

        // G. Apagar os layouts 2D do mapa
        await connection.execute('DELETE FROM office_layouts WHERE office_name = ?', [officeName]);

        // H. Apagar o escritório
        await connection.execute('DELETE FROM offices WHERE id = ?', [id]);

        // Confirmar transação na BD
        await connection.commit();
        res.json({ message: 'Escritório e todos os seus recursos e reservas foram eliminados permanentemente!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao eliminar escritório:', error);
        res.status(500).json({ message: 'Erro ao eliminar escritório. Detalhes: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
};
// 5. Obter layout de um escritório/piso (Imagem de fundo, tamanho e paredes)
exports.getOfficeLayout = async (req, res) => {
    const { office_name, floor } = req.query;

    if (!office_name || !floor) {
        return res.status(400).json({ message: 'O nome do escritório e o piso são obrigatórios.' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT * FROM office_layouts WHERE office_name = ? AND floor = ?',
            [office_name, parseInt(floor)]
        );

        if (rows.length === 0) {
            return res.json({
                office_name,
                floor: parseInt(floor),
                map_image: null,
                map_width: 800,
                map_height: 500,
                walls: []
            });
        }

        const layout = rows[0];
        let walls = [];
        if (layout.walls) {
            try {
                walls = typeof layout.walls === 'string' ? JSON.parse(layout.walls) : layout.walls;
            } catch (e) {
                console.error('Erro ao fazer parse das paredes:', e);
            }
        }

        res.json({
            office_name: layout.office_name,
            floor: layout.floor,
            map_image: layout.map_image,
            map_width: layout.map_width,
            map_height: layout.map_height,
            walls: walls,
            pixels_per_meter: layout.pixels_per_meter || 50
        });
    } catch (error) {
        console.error('Erro ao obter layout do escritório:', error);
        res.status(500).json({ message: 'Erro ao obter layout do escritório.' });
    }
};

// 6. Guardar ou atualizar layout de um escritório/piso (Imagem de fundo, tamanho e paredes)
exports.saveOfficeLayout = async (req, res) => {
    const { office_name, floor, map_image, map_width, map_height, walls, pixels_per_meter } = req.body;

    if (!office_name || floor === undefined) {
        return res.status(400).json({ message: 'O nome do escritório e o piso são obrigatórios.' });
    }

    try {
        const width = map_width || 800;
        const height = map_height || 500;
        const wallsStr = walls ? JSON.stringify(walls) : '[]';
        const ppm = pixels_per_meter || 50;

        await db.execute(`
            INSERT INTO office_layouts (office_name, floor, map_image, map_width, map_height, walls, pixels_per_meter)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                map_image = VALUES(map_image),
                map_width = VALUES(map_width),
                map_height = VALUES(map_height),
                walls = VALUES(walls),
                pixels_per_meter = VALUES(pixels_per_meter)
        `, [office_name, parseInt(floor), map_image || null, width, height, wallsStr, ppm]);

        res.json({ message: 'Layout guardado com sucesso!' });
    } catch (error) {
        console.error('Erro ao guardar layout do escritório:', error);
        res.status(500).json({ message: 'Erro ao guardar layout do escritório.' });
    }
};

