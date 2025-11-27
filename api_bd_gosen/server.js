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

// 2. Endpoint de Búsqueda
app.get('/api/gosen/empleados', async (req, res) => {
    // Si no envían q, usamos cadena vacía para traer los por defecto
    const q = req.query.q || '';

    try {
        const pool = await mssql.connect(dbConfig);

        // --- CONSULTA SQL SEGURA (READ-ONLY) ---
        const query = `
            SELECT TOP 50
                r.cod_recurso AS Cedula,
                r.nombres + ' ' + r.apellidos AS NombreCompleto,
                c.id_oficio AS CargoID,
                c.id_area AS AreaID,
                r.mail AS Email
            FROM rh_recursos r
            INNER JOIN rh_co_contratos c ON r.id_recurso = c.id_recurso
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
        // Cerramos la conexión inmediatamente
        await mssql.close();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Gosen (Modo Lectura) corriendo en http://localhost:${PORT}`);
});