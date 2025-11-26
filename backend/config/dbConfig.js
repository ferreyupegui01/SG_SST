// backend/dbConfig.js

import mssql from 'mssql';
// Asegura que dotenv se cargue
import 'dotenv/config';

// Configuración de la conexión leída desde .env
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, // Para Azure SQL
        trustServerCertificate: true // Cambia a false si usas un certificado SSL/TLS de confianza
    }
};

// --- Exportación Nombrada (ESM) ---
// Creamos y exportamos la promesa del pool directamente
export const poolPromise = new mssql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Conectado a SQL Server (mssql)');
        return pool;
    })
    .catch(err => {
        console.error('Error de conexión a la base de datos:', err);
        process.exit(1); // Termina la aplicación si no se puede conectar a la DB
    });

// Exportamos mssql para poder usar tipos (ej. mssql.NVarChar) en los controladores
export { mssql };