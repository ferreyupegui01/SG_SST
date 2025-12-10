// backend/server.js

import express from 'express';
import cors from 'cors';
import 'dotenv/config'; 
import path from 'path';
import { fileURLToPath } from 'url';
import { initCronJobs } from './services/cronService.js';
import { verificarConexionCorreo } from './config/mailer.js'; // <--- NUEVO

// --- Importación de Rutas (ESM) ---
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import inspectionRoutes from './routes/inspectionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import acpmRoutes from './routes/acpmRoutes.js'; 
import assetRoutes from './routes/assetRoutes.js'; 
import dashboardRoutes from './routes/dashboardRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import medicalRoutes from './routes/medicalRoutes.js';
import logRoutes from './routes/logRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import indicatorRoutes from './routes/indicatorRoutes.js';
import pesvRoutes from './routes/pesvRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import collabDocsRoutes from './routes/collabDocsRoutes.js';
import committeeRoutes from './routes/committeeRoutes.js'
import budgetRoutes from './routes/budgetRoutes.js';
import historyRoutes from './routes/historyRoutes.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// --- Middleware de Archivos Estáticos ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Definición de Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/cronogramas', scheduleRoutes);
app.use('/api/actividades', activityRoutes);
app.use('/api/inspecciones', inspectionRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/acpm', acpmRoutes); 
app.use('/api/activos', assetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documentos', documentRoutes);
app.use('/api/medicina', medicalRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/indicadores', indicatorRoutes);
app.use('/api/pesv', pesvRoutes);
app.use('/api/solicitudes', requestRoutes);
app.use('/api/colaboradores-docs', collabDocsRoutes);
app.use('/api/actas', committeeRoutes);
app.use('/api/presupuesto', budgetRoutes);
app.use('/api/historial', historyRoutes);

// --- Inicializadores ---
initCronJobs();
verificarConexionCorreo(); // <--- INICIALIZAR CORREO

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo exitosamente en el puerto ${port}`);
});