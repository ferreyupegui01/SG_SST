import express from 'express';
import cors from 'cors';
import mssql from 'mssql';
import 'dotenv/config';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// 1. Credenciales
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, 
        trustServerCertificate: true
    }
};

// 2. Endpoint de Búsqueda General (Se mantiene igual)
app.get('/api/gosen/empleados', async (req, res) => {
    const q = req.query.q || '';

    try {
        const pool = await mssql.connect(dbConfig);

        const query = `
            SELECT TOP 50
                r.cod_recurso AS Cedula,
                r.nombres + ' ' + r.apellidos AS NombreCompleto,
                o.des_oficio AS CargoNombre,
                c.id_area AS AreaID,
                r.mail AS Email
            FROM [dbo].[rh_recursos] r
            INNER JOIN [dbo].[rh_co_contratos] c ON r.id_recurso = c.id_recurso
            LEFT JOIN [dbo].[rh_oficios] o ON c.id_oficio = o.id_oficio
            WHERE 
                c.estado = 1 
                AND (
                    r.cod_recurso LIKE @search OR 
                    r.nombres LIKE @search OR 
                    r.apellidos LIKE @search
                )
            ORDER BY r.nombres ASC
        `;

        const result = await pool.request()
            .input('search', mssql.NVarChar, `%${q}%`)
            .query(query);

        res.json(result.recordset);

    } catch (err) {
        console.error('❌ Error en API GOSEN:', err.message);
        res.status(500).json({ error: 'Error conectando a Nómina' });
    } finally {
        await mssql.close();
    }
});

// 3. NUEVO ENDPOINT: Obtener Conductores y Montacarguistas (CORREGIDO)
app.get('/api/gosen/conductores-activos', async (req, res) => {
    try {
        const pool = await mssql.connect(dbConfig);

        // CONSULTA AJUSTADA A LA LISTA REAL DE CARGOS
        const query = `
            SELECT 
                r.cod_recurso AS Cedula,
                r.nombres + ' ' + r.apellidos AS NombreCompleto,
                o.des_oficio AS CargoNombre,
                r.mail AS Email
            FROM [dbo].[rh_recursos] r
            INNER JOIN [dbo].[rh_co_contratos] c ON r.id_recurso = c.id_recurso
            LEFT JOIN [dbo].[rh_oficios] o ON c.id_oficio = o.id_oficio
            WHERE 
                c.estado = 1 -- Solo empleados activos
                AND (
                    o.des_oficio LIKE '%CONDUCTOR%' OR        -- Atrapa: CONDUCTOR, CONDUCTOR MAYORISTA
                    o.des_oficio LIKE '%MONTACARGUISTA%' OR   -- Atrapa: MONTACARGUISTA, MONTACARGUISTA RECIBO
                    o.des_oficio LIKE '%MOTOCARGUISTA%' OR    -- Atrapa: MOTOCARGUISTA
                    o.des_oficio LIKE '%CHOFER%' OR 
                    o.des_oficio LIKE '%TRANSPORTADOR%'
                )
            ORDER BY r.nombres ASC
        `;

        const result = await pool.request().query(query);
        res.json(result.recordset);

    } catch (err) {
        console.error('❌ Error obteniendo conductores GOSEN:', err.message);
        res.status(500).json({ error: 'Error consultando conductores externos' });
    } finally {
        await mssql.close();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Gosen (Cargos: Montacarguista/Conductor) corriendo en http://localhost:${PORT}`);
});