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

// 2. Endpoint de Búsqueda General (ACTUALIZADO)
app.get('/api/gosen/empleados', async (req, res) => {
    const q = req.query.q || '';

    try {
        const pool = await mssql.connect(dbConfig);

        // CONSULTA SQL
        // Traemos todas las fechas posibles para decidir en el backend cuál mostrar
        const query = `
            SELECT TOP 50
                r.cod_recurso AS Cedula,
                r.nombres + ' ' + r.apellidos AS NombreCompleto,
                o.des_oficio AS CargoNombre,
                r.mail AS Email,
                
                -- Centro de Costos
                ISNULL(cc.des_centro_costo, 'Sin Centro Asignado') AS CentroCosto,
                
                -- Fechas y Estado
                c.fecha_inicio AS FechaInicio,
                c.fecha_fin AS FechaFin,
                c.fecha_terminacion AS FechaTerminacion,
                c.estado AS EstadoContrato

            FROM [dbo].[rh_recursos] r
            INNER JOIN [dbo].[rh_co_contratos] c ON r.id_recurso = c.id_recurso
            LEFT JOIN [dbo].[rh_oficios] o ON c.id_oficio = o.id_oficio
            LEFT JOIN [dbo].[rh_co_centros_costos] cc ON c.id_centro_costo = cc.id_centro_costo
            
            WHERE 
                (
                    r.cod_recurso LIKE @search OR 
                    r.nombres LIKE @search OR 
                    r.apellidos LIKE @search
                )
            
            -- Ordenar: Activos (1) primero
            ORDER BY c.estado DESC, r.nombres ASC
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

// 3. Endpoint Conductores (PESV)
app.get('/api/gosen/conductores-activos', async (req, res) => {
    try {
        const pool = await mssql.connect(dbConfig);
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
                c.estado = 1 
                AND (
                    o.des_oficio LIKE '%CONDUCTOR%' OR
                    o.des_oficio LIKE '%MONTACARGUISTA%' OR
                    o.des_oficio LIKE '%MOTOCARGUISTA%' OR
                    o.des_oficio LIKE '%CHOFER%' OR 
                    o.des_oficio LIKE '%TRANSPORTADOR%'
                )
            ORDER BY r.nombres ASC
        `;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error conductores GOSEN:', err.message);
        res.status(500).json({ error: 'Error consultando conductores' });
    } finally {
        await mssql.close();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API Gosen corriendo en http://localhost:${PORT}`);
});